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
        const first = Array.isArray(t.posts) && t.posts[0] ? t.posts[0] : null;
        const snippetParts = [
          t.title || "",
          (first && first.text) || "",
        ].filter(Boolean);
        // include up to two more post snippets
        if (Array.isArray(t.posts)) {
          for (let i = 1; i < Math.min(3, t.posts.length); i++) {
            snippetParts.push(t.posts[i].text || "");
          }
        }
        const snippet = snippetParts.join(" \n\n").slice(0, 2000);
        threads.push({
          id: t.id,
          title: t.title || "",
          ownerId: user.id,
          ownerName: user.displayName || user.username || user.id,
          posts: t.posts || [],
          toolId: t.toolId || null,
          keywords: t.keywords || [],
          snippet,
          date:
            t.createdAt || (first && first.date) || new Date().toISOString(),
          likes: Array.isArray(t.likes) ? t.likes : [],
        });
      }
    }

    // Quick local fallback ranking (token overlap)
    function localRank(q) {
      const qTokens = q
        .toLowerCase()
        .split(/[^\w]+/)
        .filter(Boolean);
      const scored = threads
        .map((th) => {
          const hay = (
            th.title +
            " " +
            th.snippet +
            " " +
            (th.ownerName || "")
          ).toLowerCase();
          let score = 0;
          for (const tk of qTokens) {
            if (!tk) continue;
            if (hay.includes(tk)) score += 1;
            else if (tk.endsWith("s") && hay.includes(tk.slice(0, -1)))
              score += 0.5;
            else if (tk.endsWith("ing") && hay.includes(tk.slice(0, -3)))
              score += 0.5;
          }
          return { thread: th, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((s) => ({ id: s.thread.id, score: s.score }));
      return scored;
    }

    // If no GEMINI key, return local ranking
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const ranked = localRank(query).map((r) => {
        const t = threads.find((tt) => tt.id === r.id);
        return { ...t, score: r.score };
      });
      return new Response(JSON.stringify(ranked), { status: 200 });
    }

    // Only include a compact list of items to stay within prompt length
    const items = threads.map((t) => ({
      id: t.id,
      title: t.title,
      snippet: t.snippet,
    }));
    const prompt = `You are given a user search query and a list of community threads. Each thread has an id, title, and a short text snippet (first post plus a few comments).

User query:
"""${query.replace(/"/g, '"')}"""

Task: Return a JSON array (best effort, up to 20 items) of objects: { id: string, score: number (0-1), reason: short justification } ordered by relevance. Only return the JSON array and nothing else.

Threads:
${JSON.stringify(items)}
`;

    // Call Gemini
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
        // map back to full thread objects
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
        // parsing failed, fallback to local rank
        const ranked = localRank(query).map((r) => {
          const t = threads.find((tt) => tt.id === r.id);
          return { ...t, score: r.score };
        });
        return new Response(JSON.stringify(ranked), { status: 200 });
      }
    } catch (e) {
      // If Gemini call fails, fallback to local rank
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
