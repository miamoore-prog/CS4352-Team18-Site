import fs from "fs/promises";
import path from "path";

const USERS_DIR = path.join(process.cwd(), "database", "users");

async function readUsers() {
  const files = await fs.readdir(USERS_DIR);
  const users = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(USERS_DIR, f), "utf8");
      users.push({ file: f, data: JSON.parse(raw) });
    } catch (e) {}
  }
  return users;
}

async function writeUserFile(fileName, data) {
  const tmp = path.join(USERS_DIR, `${fileName}.tmp`);
  const target = path.join(USERS_DIR, fileName);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, target);
}

export async function GET(req) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const filterTool = params.get("tool");
  const keywords = params.get("keywords")
    ? params
        .get("keywords")
        .split(",")
        .map((s) => s.trim())
    : [];
  const sort = params.get("sort") || "recent";

  const users = await readUsers();
  const threads = [];
  // helper to resolve an author identifier (could be user id, username, or displayName)
  function resolveAuthorName(author) {
    if (!author) return author;
    // try id match first
    const byId = users.find((u) => u.data && u.data.id === author);
    if (byId)
      return byId.data.displayName || byId.data.username || byId.data.id;
    // then try username
    const byUsername = users.find((u) => u.data && u.data.username === author);
    if (byUsername)
      return (
        byUsername.data.displayName ||
        byUsername.data.username ||
        byUsername.data.id
      );
    // otherwise, return the raw author string
    return String(author);
  }
  for (const u of users) {
    const user = u.data;
    if (!user.threads) continue;
    for (const t of user.threads) {
      const firstPost =
        Array.isArray(t.posts) && t.posts[0] ? t.posts[0] : null;
      const fallbackNow = new Date().toISOString();
      const date = t.createdAt || (firstPost && firstPost.date) || fallbackNow;
      // normalize post authors to friendly first-name when possible
      const posts = (t.posts || []).map((p) => ({
        ...p,
        author: resolveAuthorName(p.author),
        date: p.date || fallbackNow,
      }));

      threads.push({
        id: t.id,
        title: t.title || "",
        ownerId: user.id,
        ownerName: user.displayName || user.username,
        posts,
        likes: Array.isArray(t.likes) ? t.likes : [],
        toolId: t.toolId || null,
        keywords: t.keywords || [],
        date,
      });
    }
  }

  // if a threadId is requested, return the single thread
  const threadId = params.get("threadId");
  if (threadId) {
    const thread = threads.find((tr) => tr.id === threadId);
    if (!thread)
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
      });
    return new Response(JSON.stringify(thread), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // apply filters
  let results = threads;
  if (filterTool) {
    results = results.filter((r) => r.toolId === filterTool);
  }
  if (keywords.length > 0) {
    results = results.filter((r) =>
      keywords.every(
        (k) => (r.keywords || []).includes(k) || (r.title || "").includes(k)
      )
    );
  }

  if (sort === "recent") {
    results.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
  }

  // support other sort modes
  if (sort === "oldest") {
    results.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });
  }

  if (sort === "liked") {
    // threads may not have explicit likes; fall back to comment count as proxy
    results.sort((a, b) => {
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;
      if (likesB !== likesA) return likesB - likesA;
      const ca = Array.isArray(a.posts) ? a.posts.length - 1 : 0;
      const cb = Array.isArray(b.posts) ? b.posts.length - 1 : 0;
      return cb - ca;
    });
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const action = body.action || "create";
    const userId = req.headers.get("x-user-id") || body.userId || null;

    if (action === "create") {
      if (!userId)
        return new Response(JSON.stringify({ error: "missing user" }), {
          status: 400,
        });
      // find user file
      const users = await readUsers();
      const target = users.find((u) => u.data.id === userId);
      if (!target)
        return new Response(JSON.stringify({ error: "user not found" }), {
          status: 404,
        });

      const user = target.data;
      const file = target.file;
      const threadId = `thread-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;
      const now = new Date().toISOString();
      const thread = {
        id: threadId,
        title: body.title || null,
        toolId: body.toolId || null,
        keywords: body.keywords || [],
        createdAt: now,
        posts: [
          {
            author: user.username || user.displayName || user.id,
            text: body.text || "",
            date: now,
          },
        ],
      };
      user.threads = user.threads || [];
      user.threads.push(thread);
      await writeUserFile(file, user);
      return new Response(JSON.stringify({ ok: true, thread }), {
        status: 201,
      });
    }

    if (action === "comment") {
      // body: { action: 'comment', threadId, text }
      const threadId = body.threadId;
      const text = body.text || "";
      const commenter = body.author || (userId ? userId : "anonymous");
      if (!threadId)
        return new Response(JSON.stringify({ error: "missing threadId" }), {
          status: 400,
        });

      const users = await readUsers();
      for (const u of users) {
        const user = u.data;
        if (!user.threads) continue;
        const t = user.threads.find((x) => x.id === threadId);
        if (t) {
          const now = new Date().toISOString();
          t.posts = t.posts || [];
          t.posts.push({ author: commenter, text, date: now });
          await writeUserFile(u.file, user);
          return new Response(JSON.stringify({ ok: true, threadId }), {
            status: 200,
          });
        }
      }
      return new Response(JSON.stringify({ error: "thread not found" }), {
        status: 404,
      });
    }

    if (action === "like") {
      // body: { action: 'like', threadId }
      const threadId = body.threadId;
      if (!threadId)
        return new Response(JSON.stringify({ error: "missing threadId" }), {
          status: 400,
        });
      if (!userId)
        return new Response(JSON.stringify({ error: "missing user" }), {
          status: 400,
        });

      const users = await readUsers();
      for (const u of users) {
        const user = u.data;
        if (!user.threads) continue;
        const t = user.threads.find((x) => x.id === threadId);
        if (t) {
          t.likes = Array.isArray(t.likes) ? t.likes : [];
          const idx = t.likes.indexOf(userId);
          let liked = false;
          if (idx === -1) {
            t.likes.push(userId);
            liked = true;
          } else {
            // toggle off
            t.likes.splice(idx, 1);
            liked = false;
          }
          await writeUserFile(u.file, user);
          return new Response(
            JSON.stringify({
              ok: true,
              threadId,
              liked,
              likes: t.likes.length,
            }),
            { status: 200 }
          );
        }
      }
      return new Response(JSON.stringify({ error: "thread not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ error: "unsupported action" }), {
      status: 400,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
