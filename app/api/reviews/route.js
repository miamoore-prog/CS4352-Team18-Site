import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const USERS_DIR = path.join(process.cwd(), "database", "users");

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get("toolId");

    const files = fs.readdirSync(USERS_DIR).filter((f) => f.endsWith(".json"));
    const reviews = [];

    for (const f of files) {
      try {
        const u = JSON.parse(fs.readFileSync(path.join(USERS_DIR, f), "utf8"));
        if (Array.isArray(u.reviews)) {
          for (const r of u.reviews) {
            // include author info if available
            if (!toolId || r.toolId === toolId) {
              reviews.push({ ...r, author: u.username, authorDisplay: u.displayName });
            }
          }
        }
      } catch (e) {
        // ignore malformed user file
      }
    }

    return NextResponse.json({ reviews });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
