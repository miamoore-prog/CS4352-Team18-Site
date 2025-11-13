"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, Button } from "../../components/ui";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkedTools, setBookmarkedTools] = useState([]);
  const [tab, setTab] = useState("bookmarks");
  const [loadingTools, setLoadingTools] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

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

  useEffect(() => {
    async function loadRequests() {
      if (!user) return setRequests([]);
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
        if (!res.ok) return setRequests([]);
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      } catch (e) {
        setRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    }
    loadRequests();
  }, [user]);

  if (!user)
    return (
      <div className="py-12">
        <Card className="max-w-2xl mx-auto text-center p-8">
          <h3 className="text-lg font-semibold mb-2">Please sign in</h3>
          <p className="text-sm text-slate-600 mb-4">
            Sign in to view your profile, bookmarks, and requests.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => (window.location.href = "/login")}>Sign in</Button>
          </div>
        </Card>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{user.displayName || user.username}</h1>
          <div className="text-sm text-slate-500">{user.email || ""}</div>
        </div>
        <div>
          <Button variant="ghost" onClick={() => (window.location.href = "/login")}>Edit profile</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <div className="flex flex-col">
              <button
                className={`text-left px-3 py-2 rounded ${tab === "bookmarks" ? "bg-slate-50" : "hover:bg-slate-50"}`}
                onClick={() => setTab("bookmarks")}
              >
                Bookmarks
              </button>
              <button
                className={`text-left px-3 py-2 rounded ${tab === "private" ? "bg-slate-50" : "hover:bg-slate-50"}`}
                onClick={() => setTab("private")}
              >
                Private Profile
              </button>
              <Link href="/tools/request" className="text-left px-3 py-2 mt-4 text-sm text-sky-600 hover:underline">Request a tool</Link>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            {tab === "bookmarks" ? (
              <div>
                <h3 className="font-semibold mb-2">Bookmarked tools</h3>
                {loadingTools ? (
                  <div>Loading…</div>
                ) : bookmarkedTools.length === 0 ? (
                  <div className="text-sm text-slate-500">You have no bookmarks yet.</div>
                ) : (
                  <div className="space-y-3">
                    {bookmarkedTools.map((t) => (
                      <div key={t.id} className="flex items-center justify-between border rounded p-3">
                        <div>
                          <Link href={`/tools/${t.id}`} className="font-semibold text-slate-800">{t.name}</Link>
                          <div className="text-xs text-slate-500">{(t.tags || []).slice(0,2).join(", ")}</div>
                        </div>
                        <div>
                          <Link href={`/tools/${t.id}`}>
                            <Button variant="ghost">View</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">My requests</h4>
                  {loadingRequests ? (
                    <div>Loading…</div>
                  ) : requests.length === 0 ? (
                    <div className="text-sm text-slate-500">You have not submitted any requests.</div>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((r) => (
                        <div key={r.id} className="border rounded p-3">
                          <div className="font-semibold">{r.toolName || r.id}</div>
                          <div className="text-xs text-slate-500">Submitted: {r.createdAt}</div>
                          <div className="mt-2">Status: <span className="font-medium">{r.status}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold mb-2">Private profile</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500">Full name</div>
                    <div className="font-medium">{user.displayName || user.username}</div>
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
