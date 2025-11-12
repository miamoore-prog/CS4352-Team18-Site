import fs from "fs";
import path from "path";
import { findUserById } from "../../../../lib/mockAuth";

const TOOLS_DIR = path.resolve(process.cwd(), "database", "tools");

async function listAllTools() {
  const files = await fs.promises.readdir(TOOLS_DIR);
  const tools = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.promises.readFile(path.join(TOOLS_DIR, f), "utf8");
    try {
      tools.push(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }
  return tools;
}

function isAdmin(req) {
  const userId = req.headers.get("x-user-id") || null;
  if (!userId) return false;
  const user = findUserById(userId);
  return user && user.role === "admin";
}

export async function GET(req) {
  try {
    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403,
      });
    }
    const tools = await listAllTools();
    return new Response(JSON.stringify(tools), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403,
      });
    }
    const body = await req.json();
    const { id, name } = body || {};
    if (!id || !name) {
      return new Response(JSON.stringify({ error: "missing id or name" }), {
        status: 400,
      });
    }

    const filePath = path.join(TOOLS_DIR, `${id}.json`);
    const toWrite = { ...body, id, name };
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(toWrite, null, 2),
      "utf8"
    );
    return new Response(JSON.stringify({ ok: true, tool: toWrite }), {
      status: 201,
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
    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403,
      });
    }
    const body = await req.json();
    const { id } = body || {};
    if (!id) {
      return new Response(JSON.stringify({ error: "missing id" }), {
        status: 400,
      });
    }
    const filePath = path.join(TOOLS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
      });
    }
    const raw = await fs.promises.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const allowed = [
      "name",
      "logo",
      "about",
      "tags",
      "intents",
      "primary_intent",
      "keywords",
      "summary",
      "details",
      "howTo",
      "hidden",
    ];
    for (const key of Object.keys(body)) {
      if (key === "id") continue;
      if (allowed.includes(key)) {
        parsed[key] = body[key];
      }
    }
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(parsed, null, 2),
      "utf8"
    );
    return new Response(JSON.stringify({ ok: true, tool: parsed }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
