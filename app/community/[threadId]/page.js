"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button } from "../../../components/ui";

export default function ThreadPage({ params }) {
  const { threadId } = use(params);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserObj, setCurrentUserObj] = useState(null);

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);
    try {
      const auth =
        typeof window !== "undefined" && localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      const headers = {};
      if (token) headers["x-user-id"] = token;
      fetch(`/api/community?threadId=${encodeURIComponent(threadId)}`, {
        headers,
      })
        .then((r) => r.json())
        .then((data) => setThread(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } catch (e) {
      setLoading(false);
    }
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
      if (res.ok) {
        // refresh
        const r2 = await fetch(
          `/api/community?threadId=${encodeURIComponent(threadId)}`,
          { headers }
        );
        const d2 = await r2.json();
        setThread(d2);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // admin: delete (hide) a comment by index in t.posts
  async function adminDeleteComment(threadId, commentIndex) {
    try {
      const auth = localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      if (!token) return;
      if (!confirm("Delete this comment (admin)?")) return;
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
      if (res.ok) {
        // refresh
        const r2 = await fetch(
          `/api/community?threadId=${encodeURIComponent(threadId)}`,
          { headers }
        );
        const d2 = await r2.json();
        setThread(d2);
      }
    } catch (e) {
      console.error(e);
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
                const r2 = await fetch(
                  `/api/community?threadId=${encodeURIComponent(threadId)}`
                );
                const d2 = await r2.json();
                setThread(d2);
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
              <div className="text-xs text-slate-500">
                {c.authorIsAdmin ? "admin" : c.authorName || c.author} •{" "}
                {c.date ? new Date(c.date).toLocaleString() : ""}
              </div>
              <div className="mt-1 text-sm">
                {c.deletedByAdmin ? (
                  currentUserObj && currentUserObj.role === "admin" ? (
                    <div>
                      <div className="italic text-red-600">
                        deleted by admin
                      </div>
                      <div className="mt-1">{c.deletedText || ""}</div>
                      <div className="mt-2">
                        <button
                          className="text-xs text-red-600"
                          onClick={() => adminDeleteComment(threadId, idx + 1)}
                        >
                          Delete (again)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm border rounded p-2 bg-slate-50">
                      <div className="text-xs text-slate-500">
                        Comment deleted by admin
                      </div>
                    </div>
                  )
                ) : (
                  <div>{c.text}</div>
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
