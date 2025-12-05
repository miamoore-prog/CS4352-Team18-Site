"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button } from "../../../components/ui";

export default function ThreadPage({ params }) {
  const { threadId } = use(params);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserObj, setCurrentUserObj] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!threadId) return;
    const abortController = new AbortController();

    setLoading(true);
    try {
      const auth =
        typeof window !== "undefined" && localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      const headers = {};
      if (token) headers["x-user-id"] = token;
      fetch(`/api/community?threadId=${encodeURIComponent(threadId)}`, {
        headers,
        signal: abortController.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          if (mountedRef.current) setThread(data);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
        })
        .finally(() => {
          if (mountedRef.current) setLoading(false);
        });
    } catch (e) {
      if (mountedRef.current) setLoading(false);
    }

    return () => {
      abortController.abort();
    };
  }, [threadId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = localStorage.getItem("mock_auth");
    const parsed = auth ? JSON.parse(auth) : null;
    const token = parsed ? parsed.token : null;
    setCurrentUser(token);
    try {
      setCurrentUserObj(parsed ? parsed.user : null);
    } catch (e) {
      setCurrentUserObj(null);
    }
  }, []);

  async function postComment(text) {
    const auth =
      typeof window !== "undefined" && localStorage.getItem("mock_auth");
    const token = auth ? JSON.parse(auth).token : null;
    const headers = { "Content-Type": "application/json" };
    if (token) headers["x-user-id"] = token;
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "comment", threadId, text }),
      });
      if (res.ok && mountedRef.current) {
        // refresh
        const r2 = await fetch(
          `/api/community?threadId=${encodeURIComponent(threadId)}`,
          { headers }
        );
        const d2 = await r2.json();
        if (mountedRef.current) setThread(d2);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // admin: delete (hide) a comment by index in t.posts
  async function adminDeleteComment(threadId, commentIndex) {
    if (!confirm("Delete this comment?")) return;
    try {
      const auth = localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      if (!token) return;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["x-user-id"] = token;
      const res = await fetch("/api/community", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "deleteComment",
          threadId,
          commentIndex,
        }),
      });
      if (res.ok && mountedRef.current) {
        alert("Comment deleted");
        // refresh
        const r2 = await fetch(
          `/api/community?threadId=${encodeURIComponent(threadId)}`,
          { headers }
        );
        const d2 = await r2.json();
        if (mountedRef.current) setThread(d2);
      }
    } catch (e) {
      if (mountedRef.current) alert("Error deleting comment");
    }
  }

  // admin: recover a deleted comment
  async function adminRecoverComment(threadId, commentIndex) {
    if (!confirm("Recover this comment?")) return;
    try {
      const auth = localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      if (!token) return;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["x-user-id"] = token;
      const res = await fetch("/api/community", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "recoverComment",
          threadId,
          commentIndex,
        }),
      });
      if (res.ok && mountedRef.current) {
        alert("Comment recovered");
        // refresh
        const r2 = await fetch(
          `/api/community?threadId=${encodeURIComponent(threadId)}`,
          { headers }
        );
        const d2 = await r2.json();
        if (mountedRef.current) setThread(d2);
      }
    } catch (e) {
      if (mountedRef.current) alert("Error recovering comment");
    }
  }

  function CommentBox({ onPosted }) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    async function post() {
      if (!text) return;
      setSending(true);
      try {
        await postComment(text);
        setText("");
        onPosted && onPosted();
      } catch (e) {
        console.error(e);
      } finally {
        setSending(false);
      }
    }
    return (
      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 border rounded px-2 py-1"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="button"
          className="px-3 py-1 bg-sky-600 text-white rounded"
          onClick={post}
          disabled={sending}
        >
          {sending ? "..." : "Comment"}
        </button>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;
  if (!thread)
    return <div className="max-w-2xl mx-auto p-8">Thread not found.</div>;

  const first =
    Array.isArray(thread.posts) && thread.posts[0] ? thread.posts[0] : null;
  const comments = Array.isArray(thread.posts) ? thread.posts.slice(1) : [];

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card className="p-6">
        <h2 className="text-xl font-semibold">
          {thread.title || thread.ownerName}
        </h2>
        <div className="text-xs text-slate-500 mt-2">
          {thread.ownerName} •{" "}
          {thread.date ? new Date(thread.date).toLocaleString() : ""}
        </div>
        <div className="mt-2">
          <button
            type="button"
            className={`inline-flex items-center gap-2 px-2 py-1 rounded text-sm border ${
              Array.isArray(thread.likes) &&
              currentUser &&
              thread.likes.includes(currentUser)
                ? "bg-pink-50 text-pink-600 border-pink-100"
                : "bg-white text-slate-700 border-slate-100"
            }`}
            onClick={async () => {
              const auth =
                typeof window !== "undefined" &&
                localStorage.getItem("mock_auth");
              const token = auth ? JSON.parse(auth).token : null;
              if (!token) return;
              const headers = { "Content-Type": "application/json" };
              if (token) headers["x-user-id"] = token;
              try {
                await fetch("/api/community", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({ action: "like", threadId }),
                });
                if (mountedRef.current) {
                  const r2 = await fetch(
                    `/api/community?threadId=${encodeURIComponent(threadId)}`
                  );
                  const d2 = await r2.json();
                  if (mountedRef.current) setThread(d2);
                }
              } catch (e) {
                console.error(e);
              }
            }}
          >
            <span>{Array.isArray(thread.likes) ? thread.likes.length : 0}</span>
            <span className="text-xs"> ♥</span>
          </button>
        </div>
        <div className="mt-4 text-sm">{first ? first.text : ""}</div>

        {thread.keywords && thread.keywords.length > 0 && (
          <div className="mt-3 text-xs text-slate-500">
            {thread.keywords.join(" • ")}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {comments.map((c, idx) => (
            <div key={idx} className="border p-3 rounded bg-slate-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs text-slate-500">
                    {c.authorIsAdmin ? "admin" : c.authorName || c.author} •{" "}
                    {c.date ? new Date(c.date).toLocaleString() : ""}
                    {c.deletedByAdmin && currentUserObj && currentUserObj.role === "admin" && (
                      <span className="italic text-red-600"> • deleted by admin</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm">
                    {c.deletedByAdmin ? (
                      currentUserObj && currentUserObj.role === "admin" ? (
                        <div className="italic text-slate-500">{c.deletedText || ""}</div>
                      ) : (
                        <div className="text-xs text-slate-500">
                          Comment deleted by admin
                        </div>
                      )
                    ) : (
                      <div>{c.text}</div>
                    )}
                  </div>
                </div>
                {currentUserObj && currentUserObj.role === "admin" && (
                  <div className="flex items-center gap-2">
                    {c.deletedByAdmin ? (
                      <button
                        className="text-xs text-green-600 hover:text-green-700 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          adminRecoverComment(threadId, c.dbIndex || idx + 1);
                        }}
                      >
                        Recover
                      </button>
                    ) : (
                      <button
                        className="text-xs text-red-600 hover:text-red-700 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          adminDeleteComment(threadId, c.dbIndex || idx + 1);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          <CommentBox onPosted={() => {}} />
        </div>
      </Card>
    </div>
  );
}
