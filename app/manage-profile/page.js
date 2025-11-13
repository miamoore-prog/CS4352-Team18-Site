"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Button } from "../../components/ui";
import Link from "next/link";

export default function ManageProfilePage() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkedTools, setBookmarkedTools] = useState([]);
  const [tab, setTab] = useState("bookmarks");
  const [loadingTools, setLoadingTools] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [msg, setMsg] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mock_auth");
      if (raw) {
        const p = JSON.parse(raw);
        setUser(p.user || null);
      }
    } catch (e) {}
  }, []);

  const userId = useMemo(() => {
    try {
      const raw = localStorage.getItem("mock_auth");
      if (!raw) return null;
      const p = JSON.parse(raw);
      return p.user?.id || null;
    } catch (e) {
      return null;
    }
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`bookmarks:${userId}`);
      const arr = raw ? JSON.parse(raw) : [];
      setBookmarks(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setBookmarks([]);
    }
  }, [userId]);

  useEffect(() => {
    async function loadTools() {
      if (!bookmarks || bookmarks.length === 0) {
        setBookmarkedTools([]);
        return;
      }
      setLoadingTools(true);
      try {
        const res = await fetch("/api/tools");
        if (!res.ok) return setBookmarkedTools([]);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.tools || [];
        const picked = arr.filter((t) => bookmarks.includes(t.id));
        setBookmarkedTools(picked);
      } catch (e) {
        setBookmarkedTools([]);
      } finally {
        setLoadingTools(false);
      }
    }
    loadTools();
  }, [bookmarks]);

  async function loadRequests() {
    if (!user) {
      setRequests([]);
      return;
    }
    setLoadingRequests(true);
    try {
      const headers = {};
      const raw = localStorage.getItem("mock_auth");
      if (raw) {
        try {
          const p = JSON.parse(raw);
          if (p.token) headers["x-user-id"] = p.token;
        } catch (e) {}
      }
      const res = await fetch("/api/tool-requests", { headers });
      if (!res.ok) throw new Error("failed to load");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
      // fetch display names for authors and comment authors
      try {
        const ids = new Set();
        const arr = Array.isArray(data) ? data : [];
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
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }

  useEffect(() => {
    if (user) loadRequests();
  }, [user]);

  const getHeaders = () => {
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
        headers: getHeaders(),
        body: JSON.stringify({ action: "comment", id, text }),
      });
      if (!res.ok) throw new Error("failed");
      setCommentText({ ...commentText, [id]: "" });
      await loadRequests();
    } catch (err) {
      setMsg({ ok: false, text: String(err) });
    }
  }

  if (!user)
    return (
      <div className="py-12">
        <Card className="max-w-2xl mx-auto text-center p-8">
          <h3 className="text-lg font-semibold mb-2">Please sign in</h3>
          <p className="text-sm text-slate-600 mb-4">
            Sign in to view your profile, bookmarks, and requests.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => (window.location.href = "/login")}>
              Sign in
            </Button>
          </div>
        </Card>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {user.displayName || user.username}
          </h1>
          <div className="text-sm text-slate-500">{user.email || ""}</div>
        </div>
        <div>
          <Button
            variant="ghost"
            onClick={() => (window.location.href = "/login")}
          >
            Edit profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <div className="flex flex-col">
              <button
                className={`text-left px-3 py-2 rounded ${
                  tab === "bookmarks" ? "bg-slate-50" : "hover:bg-slate-50"
                }`}
                onClick={() => setTab("bookmarks")}
              >
                Bookmarks
              </button>
              <button
                className={`text-left px-3 py-2 rounded ${
                  tab === "requests" ? "bg-slate-50" : "hover:bg-slate-50"
                }`}
                onClick={() => setTab("requests")}
              >
                My Requests
              </button>
              <button
                className={`text-left px-3 py-2 rounded ${
                  tab === "private" ? "bg-slate-50" : "hover:bg-slate-50"
                }`}
                onClick={() => setTab("private")}
              >
                My Profile
              </button>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            {tab === "bookmarks" ? (
              <div>
                <h3 className="font-semibold mb-2">Your List</h3>
                {loadingTools ? (
                  <div>Loading…</div>
                ) : bookmarkedTools.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    You have no bookmarks yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookmarkedTools.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between border rounded p-3"
                      >
                        <div>
                          <Link
                            href={`/tools/${t.id}`}
                            className="font-semibold text-slate-800"
                          >
                            {t.name}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {(t.tags || []).slice(0, 2).join(", ")}
                          </div>
                        </div>
                        <div>
                          <Button
                            variant="ghost"
                            onClick={() => router.push(`/tools/${t.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* My requests removed from bookmarks section per user request */}
              </div>
            ) : tab === "requests" ? (
              <div>
                <h3 className="font-semibold mb-2">My tool requests</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Your submitted requests and any admin responses.
                </p>

                {msg && (
                  <div className={`mb-3 ${msg.ok ? "text-green-600" : "text-red-600"}`}>
                    {msg.text}
                  </div>
                )}

                {loadingRequests ? (
                  <div>Loading…</div>
                ) : (
                  <div className="space-y-3">
                    {requests.length === 0 && (
                      <div className="text-sm text-slate-500">
                        You have not submitted any requests.
                      </div>
                    )}
                    {requests.map((r) => (
                      <div key={r.id} className="border rounded p-4">
                        <div>
                          <div className="font-semibold">
                            {r.toolName}{" "}
                            <span className="text-xs text-slate-500">{r.id}</span>
                          </div>
                          <div className="text-sm text-slate-600">{r.usage}</div>
                          <div className="text-xs text-slate-400">
                            Submitted: {r.createdAt}
                          </div>
                          <div className="text-sm mt-2">
                            Status: <span className="font-semibold">{r.status}</span>
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
                                    {name} • {c.createdAt}
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
            ) : (
              <div>
                <h3 className="font-semibold mb-2">My profile</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500">Full name</div>
                    <div className="font-medium">
                      {user.displayName || user.username}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Email</div>
                    <div className="font-medium">{user.email || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Role</div>
                    <div className="font-medium">{user.role || "user"}</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
