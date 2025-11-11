import { findUserById, sanitizeUserForClient } from "../../../../lib/mockAuth";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    if (!id)
      return new Response(JSON.stringify({ error: "missing id" }), {
        status: 400,
      });
    const u = findUserById(id);
    if (!u)
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
      });
    const s = sanitizeUserForClient(u);
    return new Response(JSON.stringify(s), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
