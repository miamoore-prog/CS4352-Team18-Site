import fs from "fs";
import path from "path";
import { findUserById } from "../../../lib/mockAuth";

const REQ_FILE = path.resolve(process.cwd(), "data", "tool-requests.json");

function ensureDataFile() {
  const dir = path.dirname(REQ_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(REQ_FILE))
    fs.writeFileSync(REQ_FILE, JSON.stringify([]), "utf8");
}

async function readAll() {
  ensureDataFile();
  const raw = await fs.promises.readFile(REQ_FILE, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeAll(arr) {
  ensureDataFile();
  await fs.promises.writeFile(REQ_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function isAdmin(userId) {
  if (!userId) return false;
  const u = findUserById(userId);
  return u && u.role === "admin";
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userId = req.headers.get("x-user-id") || null;

    if (body && body.action === "comment") {
      const { id, text } = body || {};
      if (!id || !text)
        return new Response(JSON.stringify({ error: "id and text required" }), {
          status: 400,
        });
      const arr = await readAll();
      const idx = arr.findIndex((r) => r.id === id);
      if (idx === -1)
        return new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
        });
      const entry = arr[idx];
      // only admin or the owner can comment
      if (!userId)
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 403,
        });
      if (!(isAdmin(userId) || entry.authorId === userId)) {
        return new Response(JSON.stringify({ error: "forbidden" }), {
          status: 403,
        });
      }
      entry.comments = entry.comments || [];
      entry.comments.push({
        authorId: userId,
        text,
        createdAt: new Date().toISOString(),
      });
      arr[idx] = entry;
      await writeAll(arr);
      return new Response(JSON.stringify({ ok: true, request: entry }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { toolName, usage, contact } = body || {};
    if (!toolName || !usage) {
      return new Response(
        JSON.stringify({ error: "toolName and usage are required" }),
        { status: 400 }
      );
    }
    const arr = await readAll();
    const entry = {
      id: `req-${Date.now()}`,
      toolName,
      usage,
      contact: contact || null,
      createdAt: new Date().toISOString(),
      authorId: userId || null,
      status: "open",
      comments: [],
    };
    arr.push(entry);
    await writeAll(arr);
    return new Response(JSON.stringify({ ok: true, request: entry }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id") || null;
    const arr = await readAll();
    if (isAdmin(userId)) {
      return new Response(JSON.stringify(arr), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (userId) {
      const mine = arr.filter((r) => r.authorId === userId);
      return new Response(JSON.stringify(mine), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const userId = req.headers.get("x-user-id") || null;
    if (!isAdmin(userId))
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403,
      });
    const { id, status, comment } = body || {};
    if (!id)
      return new Response(JSON.stringify({ error: "missing id" }), {
        status: 400,
      });
    const arr = await readAll();
    const idx = arr.findIndex((r) => r.id === id);
    if (idx === -1)
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
      });
    const entry = arr[idx];
    if (status) entry.status = status;
    if (comment) {
      entry.comments = entry.comments || [];
      entry.comments.push({
        authorId: userId,
        text: comment,
        createdAt: new Date().toISOString(),
      });
    }
    if (status === "closed") entry.closedAt = new Date().toISOString();
    arr[idx] = entry;
    await writeAll(arr);
    return new Response(JSON.stringify({ ok: true, request: entry }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
