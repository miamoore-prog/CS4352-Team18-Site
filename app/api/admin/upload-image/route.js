import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const body = await req.json();
    const { filename, contentType, data } = body || {};
    if (!filename || !data)
      return new Response(
        JSON.stringify({ error: "missing filename or data" }),
        { status: 400 }
      );

    const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    // sanitize filename: allow only letters, numbers, dash, underscore, dot
    const safeName = filename.replace(/[^a-zA-Z0-9-_.]/g, "_");
    // prefix timestamp to avoid clashes
    const finalName = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, finalName);

    const buf = Buffer.from(data, "base64");
    await fs.promises.writeFile(filePath, buf);

    const url = `/uploads/${finalName}`;
    return new Response(JSON.stringify({ ok: true, url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
