import fs from "fs/promises";
import path from "path";
import { findUserById } from "../../../lib/mockAuth";

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
    return String(author);
  }
  for (const u of users) {
    const user = u.data;
    if (!user.threads) continue;
    for (const t of user.threads) {
      const flagged = t.flagged || false;
      const firstPost =
        Array.isArray(t.posts) && t.posts[0] ? t.posts[0] : null;
      const fallbackNow = new Date().toISOString();
      const date = t.createdAt || (firstPost && firstPost.date) || fallbackNow;
      const posts = (t.posts || []).map((p) => {
        const rawAuthor = p.author;
        const byId = users.find(
          (u) =>
            u.data && (u.data.id === rawAuthor || u.data.username === rawAuthor)
        );
        const authorName = resolveAuthorName(rawAuthor);
        const authorIsAdmin = !!(
          byId &&
          byId.data &&
          byId.data.role === "admin"
        );
        return {
          ...p,
          authorId: rawAuthor,
          author: authorName,
          authorName,
          authorIsAdmin,
          date: p.date || fallbackNow,
        };
      });

      threads.push({
        id: t.id,
        title: t.title || "",
        ownerId: user.id,
        ownerName: user.displayName || user.username,
        posts,
        flagged,
        likes: Array.isArray(t.likes) ? t.likes : [],
        toolId: t.toolId || null,
        keywords: t.keywords || [],
        date,
      });
    }
  }

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

  let results = threads;
  const reqUserId = req.headers.get("x-user-id") || null;
  const requesterIsAdmin =
    reqUserId &&
    findUserById(reqUserId) &&
    findUserById(reqUserId).role === "admin";
  results = results.filter((r) => {
    if (!r.flagged) return true;
    if (requesterIsAdmin) return true;
    if (reqUserId && r.ownerId === reqUserId) return true;
    return false;
  });
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

  if (sort === "oldest") {
    results.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });
  }

  if (sort === "liked") {
    results.sort((a, b) => {
      const likesA = Array.isArray(a.likes) ? a.likes.length : 0;
      const likesB = Array.isArray(b.likes) ? b.likes.length : 0;
      if (likesB !== likesA) return likesB - likesA;
      const ca = Array.isArray(a.posts) ? Math.max(0, a.posts.length - 1) : 0;
      const cb = Array.isArray(b.posts) ? Math.max(0, b.posts.length - 1) : 0;
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
        flagged: false,
      };
      user.threads = user.threads || [];
      user.threads.push(thread);
      await writeUserFile(file, user);
      return new Response(JSON.stringify({ ok: true, thread }), {
        status: 201,
      });
    }

    if (action === "comment") {
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

    if (action === "flag") {
      const threadId = body.threadId;
      const flag = !!body.flag;
      if (!threadId)
        return new Response(JSON.stringify({ error: "missing threadId" }), {
          status: 400,
        });
      const user = findUserById(userId);
      if (!user || user.role !== "admin")
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 403,
        });

      const users = await readUsers();
      for (const u of users) {
        const obj = u.data;
        if (!obj.threads) continue;
        const t = obj.threads.find((x) => x.id === threadId);
        if (t) {
          t.flagged = flag;
          t.flaggedBy = flag ? userId : undefined;
          t.flaggedAt = flag ? new Date().toISOString() : undefined;
          await writeUserFile(u.file, obj);
          return new Response(
            JSON.stringify({ ok: true, threadId, flagged: flag }),
            { status: 200 }
          );
        }
      }
      return new Response(JSON.stringify({ error: "thread not found" }), {
        status: 404,
      });
    }

    if (action === "deleteComment") {
      const threadId = body.threadId;
      const idx =
        typeof body.commentIndex === "number" ? body.commentIndex : null;
      if (!threadId)
        return new Response(JSON.stringify({ error: "missing threadId" }), {
          status: 400,
        });
      const user = findUserById(userId);
      if (!user || user.role !== "admin")
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 403,
        });

      const users = await readUsers();
      for (const u of users) {
        const obj = u.data;
        if (!obj.threads) continue;
        const t = obj.threads.find((x) => x.id === threadId);
        if (t) {
          if (!Array.isArray(t.posts))
            return new Response(JSON.stringify({ error: "no posts" }), {
              status: 400,
            });
          if (idx === null || idx < 0 || idx >= t.posts.length)
            return new Response(JSON.stringify({ error: "invalid index" }), {
              status: 400,
            });
          const c = t.posts[idx];
          c.deletedByAdmin = true;
          c.deletedAt = new Date().toISOString();
          c.deletedBy = userId;
          c.deletedText = c.text;
          c.text = "";
          await writeUserFile(u.file, obj);
          return new Response(
            JSON.stringify({ ok: true, threadId, commentIndex: idx }),
            { status: 200 }
          );
        }
      }
      return new Response(JSON.stringify({ error: "thread not found" }), {
        status: 404,
      });
    }

    if (action === "deleteThread") {
      const threadId = body.threadId;
      if (!threadId)
        return new Response(JSON.stringify({ error: "missing threadId" }), {
          status: 400,
        });
      const user = findUserById(userId);
      if (!user || user.role !== "admin")
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 403,
        });

      const users = await readUsers();
      for (const u of users) {
        const obj = u.data;
        if (!obj.threads) continue;
        const idx = obj.threads.findIndex((x) => x.id === threadId);
        if (idx !== -1) {
          obj.threads.splice(idx, 1);
          await writeUserFile(u.file, obj);
          return new Response(JSON.stringify({ ok: true, threadId }), {
            status: 200,
          });
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
