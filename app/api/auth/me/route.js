import { findUserById, sanitizeUserForClient } from "../../../../lib/mockAuth";

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id") || null;
    if (!userId) {
      return new Response(JSON.stringify({ user: null }), { status: 200 });
    }
    const user = findUserById(userId);
    return new Response(JSON.stringify({ user: sanitizeUserForClient(user) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
