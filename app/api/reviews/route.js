import { promises as fs } from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "reviews-store.json");

async function readStore() {
  try {
    const txt = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(txt);
  } catch (err) {
    return {};
  }
}

async function writeStore(data) {
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const tool = params.get("tool");
    const sort = params.get("sort");
    const keywordsParam = params.get("keywords");

    const store = await readStore();

    if (tool) {
      const items = store[tool] || [];

      let filtered = items;

      if (keywordsParam) {
        const keywords = keywordsParam.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
        filtered = filtered.filter((r) => {
          const text = (r.text || "").toLowerCase();
          const kws = (r.keywords || []).map((k) => k.toLowerCase());
          return keywords.every((k) => text.includes(k) || kws.includes(k));
        });
      }

      if (sort === "liked") {
        filtered = filtered.slice().sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else {
        // default: recent (by date)
        filtered = filtered.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      return new Response(JSON.stringify(filtered), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(store), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const store = await readStore();

    if (body.action === "like") {
      const { toolId, reviewId } = body;
      if (!toolId || !reviewId) {
        return new Response(JSON.stringify({ error: "toolId and reviewId required" }), { status: 400 });
      }
      const list = store[toolId] || [];
      const idx = list.findIndex((r) => r.id === reviewId);
      if (idx === -1) return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
      list[idx].likes = (list[idx].likes || 0) + 1;
      await writeStore(store);
      return new Response(JSON.stringify(list[idx]), { status: 200 });
    }

    const { toolId, author, rating, text, keywords } = body;
    if (!toolId || !author || !rating || !text) {
      return new Response(JSON.stringify({ error: "toolId, author, rating, text required" }), { status: 400 });
    }

    const newReview = {
      id: `${toolId}-r${Date.now()}`,
      author,
      rating: Number(rating),
      text,
      keywords: Array.isArray(keywords) ? keywords : (typeof keywords === 'string' ? keywords.split(',').map(k=>k.trim()).filter(Boolean) : []),
      date: new Date().toISOString(),
      likes: 0,
    };

    store[toolId] = store[toolId] || [];
    store[toolId].unshift(newReview);
    await writeStore(store);

    return new Response(JSON.stringify(newReview), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
