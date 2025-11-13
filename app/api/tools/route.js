import fs from "fs";
import path from "path";

const db = path.resolve(process.cwd(), "database", "tools");

export async function GET(req) {
  try {
    const files = await fs.promises.readdir(db);
    const tools = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const raw = await fs.promises.readFile(path.join(db, f), "utf8");
      try {
        const parsed = JSON.parse(raw);
        // filter out hidden tools from public API
        if (!parsed.hidden) {
          tools.push(parsed);
        }
      } catch (e) {
        // ignore invalid json files
      }
    }

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
