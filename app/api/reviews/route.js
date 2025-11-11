import { promises as fs } from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "reviews-store.json");
const USERS_DIR = path.join(process.cwd(), "database", "users");

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

async function tryResolveAuthorDisplay(authorId) {
  if (!authorId) return null;
  try {
    const f = path.join(USERS_DIR, `${authorId}.json`);
    const txt = await fs.readFile(f, "utf8");
    const d = JSON.parse(txt);
    return d.displayName || d.username || null;
  } catch (e) {
    return null;
  }
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

      // enrich authorDisplay where possible
      for (const it of items) {
        if (!it.authorDisplay) {
          const aid = it.authorId || it.author;
          if (aid) {
            try {
              const disp = await tryResolveAuthorDisplay(aid);
              if (disp) it.authorDisplay = disp;
            } catch (e) {}
          }
        }
      }

      let filtered = items;

      if (keywordsParam) {
        const keywords = keywordsParam
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);
        filtered = filtered.filter((r) => {
          const text = (r.text || "").toLowerCase();
          const kws = (r.keywords || []).map((k) => k.toLowerCase());
          return keywords.every((k) => text.includes(k) || kws.includes(k));
        });
      }

      if (sort === "liked") {
        filtered = filtered
          .slice()
          .sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else if (sort === "oldest") {
        // oldest first
        filtered = filtered
          .slice()
          .sort((a, b) => new Date(a.date) - new Date(b.date));
      } else {
        // default: recent (by date)
        filtered = filtered
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date));
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
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const store = await readStore();
    const userId = req.headers.get("x-user-id") || null;

    if (body.action === "like") {
      const { toolId, reviewId } = body;
      if (!toolId || !reviewId) {
        return new Response(
          JSON.stringify({ error: "toolId and reviewId required" }),
          { status: 400 }
        );
      }
      const list = store[toolId] || [];
      const idx = list.findIndex((r) => r.id === reviewId);
      if (idx === -1)
        return new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
        });
      list[idx].likes = (list[idx].likes || 0) + 1;
      await writeStore(store);
      return new Response(JSON.stringify(list[idx]), { status: 200 });
    }

    if (body.action === "delete-my-review") {
      const toolId = body.toolId;
      const userId = req.headers.get("x-user-id") || null;
      if (!toolId || !userId)
        return new Response(
          JSON.stringify({ error: "toolId and user required" }),
          { status: 400 }
        );
      store[toolId] = (store[toolId] || []).filter(
        (r) =>
          !(
            (r.authorId && r.authorId === userId) ||
            (r.author && r.author === userId)
          )
      );
      await writeStore(store);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Upsert review: if a review by this user exists for the tool, append an edit entry to history; otherwise create a new review.
    const { toolId, title, rating, text, keywords } = body;
    if (!toolId || !text) {
      return new Response(
        JSON.stringify({ error: "toolId and text required" }),
        { status: 400 }
      );
    }

    store[toolId] = store[toolId] || [];

    // If userId provided, try to find existing review by authorId
    if (userId) {
      let existing = store[toolId].find(
        (r) =>
          (r.authorId && r.authorId === userId) ||
          (r.author && r.author === userId)
      );
      const now = new Date().toISOString();
      if (existing) {
        // ensure history exists and include the prior rating if available
        existing.history = existing.history || [
          {
            date: existing.date || now,
            text: existing.text || "",
            rating:
              typeof existing.rating !== "undefined" ? existing.rating : null,
          },
        ];
        // push new edit entry; record the rating at this edit (explicit or current)
        const editRating =
          typeof rating !== "undefined" && rating !== null
            ? Number(rating)
            : typeof existing.rating !== "undefined"
            ? existing.rating
            : null;
        existing.history.push({ date: now, text, rating: editRating });
        existing.text = text;
        existing.rating =
          typeof rating !== "undefined"
            ? rating === null
              ? null
              : Number(rating)
            : existing.rating;
        existing.date = now;
        existing.keywords = Array.isArray(keywords)
          ? keywords
          : existing.keywords || [];
        await writeStore(store);
        // resolve display name if possible
        existing.authorDisplay =
          existing.authorDisplay || (await tryResolveAuthorDisplay(userId));
        return new Response(JSON.stringify(existing), { status: 200 });
      }

      // create new review with authorId
      const newReview = {
        id: `${toolId}-r${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: title || null,
        authorId: userId,
        author: userId,
        authorDisplay: await tryResolveAuthorDisplay(userId),
        rating:
          typeof rating !== "undefined"
            ? rating === null
              ? null
              : Number(rating)
            : null,
        text,
        history: [
          {
            date: new Date().toISOString(),
            text,
            rating:
              typeof rating !== "undefined"
                ? rating === null
                  ? null
                  : Number(rating)
                : null,
          },
        ],
        keywords: Array.isArray(keywords)
          ? keywords
          : typeof keywords === "string"
          ? keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
          : [],
        date: new Date().toISOString(),
        likes: 0,
      };
      store[toolId].unshift(newReview);
      await writeStore(store);
      return new Response(JSON.stringify(newReview), { status: 201 });
    }

    // Fallback: anonymous review (preserve legacy behavior) — require rating for anonymous
    if (!rating) {
      return new Response(
        JSON.stringify({ error: "rating required for anonymous review" }),
        { status: 400 }
      );
    }
    const anonReview = {
      id: `${toolId}-r${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title || null,
      author: null,
      rating: Number(rating),
      text,
      history: [
        { date: new Date().toISOString(), text, rating: Number(rating) },
      ],
      keywords: Array.isArray(keywords)
        ? keywords
        : typeof keywords === "string"
        ? keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : [],
      date: new Date().toISOString(),
      likes: 0,
    };
    store[toolId].unshift(anonReview);
    await writeStore(store);
    return new Response(JSON.stringify(anonReview), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
