"use client";

import { useEffect, useState } from "react";

export default function AdminRequestsPage() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mock_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || null);
      }
    } catch (e) {}
  }, []);

  async function load() {
    setLoading(true);
    try {
      const headers = {};
      const raw = localStorage.getItem("mock_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.token) headers["x-user-id"] = parsed.token;
      }
      const res = await fetch("/api/tool-requests", { headers });
      if (!res.ok) throw new Error("failed to load");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setRequests(arr);
      // fetch display names for comment authors and request authors
      try {
        const ids = new Set();
        arr.forEach((r) => {
          if (r.authorId) ids.add(r.authorId);
          (r.comments || []).forEach((c) => {
            if (c.authorId) ids.add(c.authorId);
          });
        });
        const map = {};
        await Promise.all(
          Array.from(ids).map(async (id) => {
            try {
              const resp = await fetch(`/api/users/${encodeURIComponent(id)}`);
              if (!resp.ok) return;
              const u = await resp.json();
              map[id] = u;
            } catch (e) {}
          })
        );
        setUserMap(map);
      } catch (e) {}
    } catch (err) {
      setMsg({ ok: false, text: String(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.role === "admin") load();
  }, [user]);

  const headers = () => {
    const h = { "Content-Type": "application/json" };
    const raw = localStorage.getItem("mock_auth");
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (p.token) h["x-user-id"] = p.token;
      } catch (e) {}
    }
    return h;
  };

  async function addComment(id) {
    const text = (commentText[id] || "").trim();
    if (!text) return;
    try {
      const res = await fetch("/api/tool-requests", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "comment", id, text }),
      });
      if (!res.ok) throw new Error("failed");
      setCommentText({ ...commentText, [id]: "" });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: String(err) });
    }
  }

  async function closeRequest(id) {
    try {
      const res = await fetch("/api/tool-requests", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id, status: "closed" }),
      });
      if (!res.ok) throw new Error("failed");
      await load();
    } catch (err) {
      setMsg({ ok: false, text: String(err) });
    }
  }

  if (!user)
    return <div className="card">Please sign in to view requests.</div>;
  if (user.role !== "admin")
    return <div className="card">You are not authorized to view requests.</div>;

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold">Tool requests</h3>
        <p className="text-sm text-slate-600">
          Requests submitted by users. Comment and close when completed.
        </p>
      </div>

      {msg && (
        <div className={msg.ok ? "text-green-600" : "text-red-600"}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-3">
          {requests.length === 0 && <div className="card">No requests</div>}
          {requests.map((r) => (
            <div key={r.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">
                    {r.toolName}{" "}
                    <span className="text-xs text-slate-500">{r.id}</span>
                  </div>
                  <div className="text-sm text-slate-600">{r.usage}</div>
                  <div className="text-xs text-slate-400">
                    Submitted: {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""} • By: {" "}
                    {userMap[r.authorId]
                      ? userMap[r.authorId].role === "admin"
                        ? "admin"
                        : userMap[r.authorId].displayName ||
                          userMap[r.authorId].username
                      : r.authorId || "anonymous"}
                  </div>
                </div>
                <div className="text-sm">
                  <div>
                    Status: <span className="font-semibold">{r.status}</span>
                  </div>
                  {r.status !== "closed" && (
                    <button
                      className="btn btn-ghost mt-2"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to close this request?"
                          )
                        )
                          closeRequest(r.id);
                      }}
                    >
                      Close this request
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <h5 className="font-semibold">Comments</h5>
                <div className="space-y-3 mt-3">
                  {(r.comments || []).map((c, i) => {
                    const u = userMap[c.authorId];
                    const name = u
                      ? u.role === "admin"
                        ? "admin"
                        : u.displayName || u.username || c.authorId
                      : c.authorId;
                    return (
                      <div key={i} className="border p-3 rounded bg-slate-50">
                        <div className="text-xs text-slate-500">
                          {name} • {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                        </div>
                        <div className="mt-1 text-sm">{c.text}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border rounded px-2 py-1"
                      placeholder="Write a comment..."
                      value={commentText[r.id] || ""}
                      onChange={(e) =>
                        setCommentText({
                          ...commentText,
                          [r.id]: e.target.value,
                        })
                      }
                    />
                    <button
                      className="px-3 py-1 bg-sky-600 text-white rounded"
                      onClick={() => addComment(r.id)}
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
