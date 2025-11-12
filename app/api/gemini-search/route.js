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

// POST /api/gemini-search
export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "missing query" }), {
        status: 400,
      });
    }

    const users = await readUsers();
    const threads = [];
    for (const u of users) {
      const user = u.data;
      if (!user.threads) continue;
      for (const t of user.threads) {
        const first = t.posts?.[0];
        const snippetParts = [t.title, first?.text].filter(Boolean);
        if (t.posts) {
          for (let i = 1; i < Math.min(3, t.posts.length); i++) {
            snippetParts.push(t.posts[i].text || "");
          }
        }
        const snippet = snippetParts.join("\n\n").slice(0, 2000);
        threads.push({
          id: t.id,
          title: t.title || "",
          ownerId: user.id,
          ownerName: user.displayName || user.username || user.id,
          posts: t.posts || [],
          toolId: t.toolId || null,
          keywords: t.keywords || [],
          snippet,
          date: t.createdAt || first?.date || new Date().toISOString(),
          likes: Array.isArray(t.likes) ? t.likes : [],
        });
      }
    }

    function localRank(q) {
      const words = q.toLowerCase().split(/\s+/);
      const scored = threads
        .map((th) => {
          const text = [th.title, th.snippet, th.ownerName]
            .join(" ")
            .toLowerCase();
          let score = 0;
          for (const word of words) {
            if (text.includes(word)) score++;
          }
          return { thread: th, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((s) => ({ id: s.thread.id, score: s.score }));
      return scored;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const ranked = localRank(query).map((r) => {
        const t = threads.find((tt) => tt.id === r.id);
        return { ...t, score: r.score };
      });
      return new Response(JSON.stringify(ranked), { status: 200 });
    }

    const items = threads.map((t) => ({
      id: t.id,
      title: t.title,
      snippet: t.snippet,
    }));
    const prompt = `Search query: "${query}"

Find the most relevant threads from this list. Return a JSON array with up to 20 results, each having: id, score (0-1), and reason.

Threads:
${JSON.stringify(items)}

Return only the JSON array.`;

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const resp = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = resp?.text ?? "";
      try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error("not-array");
        const out = parsed
          .map((p) => {
            const t = threads.find((tt) => tt.id === p.id);
            if (!t) return null;
            return {
              ...t,
              score: typeof p.score === "number" ? p.score : 0,
              reason: p.reason || "",
            };
          })
          .filter(Boolean);
        return new Response(JSON.stringify(out), { status: 200 });
      } catch (e) {
        const ranked = localRank(query).map((r) => {
          const t = threads.find((tt) => tt.id === r.id);
          return { ...t, score: r.score };
        });
        return new Response(JSON.stringify(ranked), { status: 200 });
      }
    } catch (e) {
      const ranked = localRank(query).map((r) => {
        const t = threads.find((tt) => tt.id === r.id);
        return { ...t, score: r.score };
      });
      return new Response(JSON.stringify(ranked), { status: 200 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
