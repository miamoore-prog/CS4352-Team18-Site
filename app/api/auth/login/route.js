import { findUserByUsername, sanitizeUserForClient } from "../../../../lib/mockAuth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};
    if (!username || !password) {
      return new Response(JSON.stringify({ error: "missing credentials" }), {
        status: 400,
      });
    }

    const user = findUserByUsername(username);
    if (!user || user.password !== password) {
      return new Response(JSON.stringify({ error: "invalid credentials" }), {
        status: 401,
      });
    }

    const safe = sanitizeUserForClient(user);
    // In a real app you'd set a cookie or JWT. For this mock, return user id and sanitized user.
    return new Response(JSON.stringify({ user: safe, token: user.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
