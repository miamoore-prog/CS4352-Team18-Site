"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "../../components/ui";

const useToolsLoader = () => {
  const [tools, setTools] = useState([]);
  useEffect(() => {
    let mounted = true;
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.tools || [];
        if (mounted) setTools(arr);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return tools;
};

export default function CommunityPage() {
  const router = useRouter();
  const mountedRef = useRef(true);

  const [storeKeys, setStoreKeys] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserObj, setCurrentUserObj] = useState(null);

  const [sort, setSort] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [flaggingThreadId, setFlaggingThreadId] = useState(null);
  const [isUpdatingPosts, setIsUpdatingPosts] = useState(false);

  const [form, setForm] = useState({
    title: "",
    author: "",
    text: "",
  });

  const tools = useToolsLoader();
  const toolIds = useMemo(
    () => (Array.isArray(tools) ? tools.map((t) => t.id) : []),
    [tools]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const auth =
      typeof window !== "undefined" && localStorage.getItem("mock_auth");
    const token = auth ? JSON.parse(auth).token : null;
    if (token) {
      setCurrentUser(token);
      try {
        const parsed = JSON.parse(auth);
        setCurrentUserObj(parsed.user || null);
      } catch (e) {}
      fetchStoreKeys();
    }

    function onStorage(e) {
      if (e.key === "mock_auth") {
        const a = e.newValue ? JSON.parse(e.newValue) : null;
        const t = a ? a.token : null;
        setCurrentUser(t);
        try {
          setCurrentUserObj(a ? a.user : null);
        } catch (e) {}
        if (t) fetchStoreKeys();
        else {
          setStoreKeys([]);
          setPosts([]);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      const auth = localStorage.getItem("mock_auth");
      const parsed = auth ? JSON.parse(auth) : null;
      setCurrentUserObj(parsed ? parsed.user : null);
    } catch (e) {
      setCurrentUserObj(null);
    }
  }, [currentUser]);

  async function fetchStoreKeys() {
    try {
      const auth = localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      const headers = {};
      if (token) headers["x-user-id"] = token;
      const res = await fetch(`/api/community`, { headers });
      const data = await res.json();
      const ids = Array.from(
        new Set((data || []).map((r) => r.toolId).filter(Boolean))
      );
      if (mountedRef.current) setStoreKeys(ids);
    } catch (err) {
      if (mountedRef.current) setStoreKeys([]);
    }
  }

  async function fetchPosts(signal) {
    console.log("fetchPosts called, mountedRef.current:", mountedRef.current);
    if (mountedRef.current) {
      console.log("Setting loading to true");
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (selectedTool) params.set("tool", selectedTool);
      if (sort) params.set("sort", sort);
      const auth = localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      const headers = {};
      if (token) headers["x-user-id"] = token;
      console.log("Fetching from API with params:", params.toString());
      const res = await fetch(`/api/community?${params.toString()}`, {
        headers,
        signal,
      });
      console.log("API response status:", res.status);
      const data = await res.json();
      console.log("Fetched posts:", data?.length || 0, "posts", "mounted:", mountedRef.current);
      if (mountedRef.current) {
        console.log("Setting posts and loading to false");
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    } catch (err) {
      console.log("Error in fetchPosts:", err.name, err.message);
      if (err.name === "AbortError") {
        console.log("Fetch aborted, mounted:", mountedRef.current);
        if (mountedRef.current) setLoading(false);
        return;
      }
      console.error("Error fetching posts:", err);
      if (mountedRef.current) {
        setPosts([]);
        setLoading(false);
      }
    }
  }

  async function performSearch(q) {
    if (!q || !q.trim()) {
      // empty search -> reload regular posts
      const controller = new AbortController();
      fetchPosts(controller.signal);
      return;
    }
    if (mountedRef.current) setSearching(true);
    try {
      const res = await fetch("/api/gemini-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) {
        // fallback to regular posts
        if (mountedRef.current) setSearching(false);
        const controller = new AbortController();
        fetchPosts(controller.signal);
        return;
      }
      const data = await res.json();
      if (mountedRef.current) {
        setPosts(Array.isArray(data) ? data : []);
        setSearching(false);
      }
    } catch (e) {
      console.error("Error searching:", e);
      if (mountedRef.current) setSearching(false);
      const controller = new AbortController();
      fetchPosts(controller.signal);
    }
  }

  useEffect(() => {
    console.log("useEffect triggered, calling fetchPosts. selectedTool:", selectedTool, "sort:", sort);
    const controller = new AbortController();
    fetchPosts(controller.signal);
    return () => {
      console.log("Aborting fetchPosts");
      controller.abort();
    };
  }, [selectedTool, sort]);

  async function handleLike(reviewId) {
    try {
      const auth = localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      if (!token) return;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["x-user-id"] = token;
      const res = await fetch("/api/community", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "like", threadId: reviewId }),
      });
      if (res.ok && mountedRef.current) {
        const controller = new AbortController();
        fetchPosts(controller.signal);
      }
    } catch (err) {
      return;
    }
  }

  async function toggleFlag(threadId, currentFlag) {
    // Prevent any flag operations while posts are being updated
    if (isUpdatingPosts || flaggingThreadId === threadId) return;

    try {
      setFlaggingThreadId(threadId);
      setIsUpdatingPosts(true);
      const auth = localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      if (!token) {
        setFlaggingThreadId(null);
        setIsUpdatingPosts(false);
        return;
      }
      const headers = { "Content-Type": "application/json" };
      if (token) headers["x-user-id"] = token;
      const res = await fetch("/api/community", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "flag", threadId, flag: !currentFlag }),
      });
      if (res.ok && mountedRef.current) {
        const controller = new AbortController();
        await fetchPosts(controller.signal);
      }
    } catch (e) {
      return;
    } finally {
      if (mountedRef.current) {
        setFlaggingThreadId(null);
        setIsUpdatingPosts(false);
      }
    }
  }

  async function handleLikeComment(threadId, commentIndex) {
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
          action: "likeComment",
          threadId,
          commentIndex,
        }),
      });
      if (res.ok && mountedRef.current) {
        const controller = new AbortController();
        fetchPosts(controller.signal);
      }
    } catch (err) {
      return;
    }
  }

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
        const controller = new AbortController();
        fetchPosts(controller.signal);
      }
    } catch (e) {
      if (mountedRef.current) alert("Error deleting comment");
    }
  }

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
        const controller = new AbortController();
        fetchPosts(controller.signal);
      }
    } catch (e) {
      if (mountedRef.current) alert("Error recovering comment");
    }
  }

  async function adminDeleteThread(threadId) {
    const thread = posts.find((p) => p.id === threadId);
    const threadTitle = thread?.title || thread?.ownerName || "this thread";

    if (!confirm(`Delete thread "${threadTitle}" and all its comments?`)) return;
    try {
      const auth = localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      if (!token) return;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["x-user-id"] = token;
      const res = await fetch("/api/community", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "deleteThread", threadId }),
      });
      if (res.ok && mountedRef.current) {
        alert("Thread deleted");
        const controller = new AbortController();
        fetchPosts(controller.signal);
      }
    } catch (e) {
      if (mountedRef.current) alert("Error deleting thread");
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    const toolToUse = composeTool || selectedTool || null;
    if (!form.text) return;
    try {
      const payload = {
        action: "create",
        toolId: toolToUse,
        title: form.title || null,
        text: form.text,
        keywords: [],
      };
      const auth = localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["x-user-id"] = token;
      const res = await fetch("/api/community", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok && mountedRef.current) {
        setForm({ title: "", author: "", text: "" });
        setComposeTool(null);
        const controller = new AbortController();
        fetchPosts(controller.signal);
      }
    } catch (err) {
      return;
    }
  }

  const [showCompose, setShowCompose] = useState(false);
  const [composeTool, setComposeTool] = useState(null);

  function CommentBox({ threadId, onPosted }) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    async function post() {
      if (!text) return;
      setSending(true);
      try {
        const auth = localStorage.getItem("mock_auth");
        const token = auth ? JSON.parse(auth).token : null;
        const headers = { "Content-Type": "application/json" };
        if (token) headers["x-user-id"] = token;
        const res = await fetch("/api/community", {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "comment", threadId, text }),
        });
        if (res.ok) {
          setText("");
          onPosted && onPosted();
        }
      } catch (e) {
        return;
      } finally {
        setSending(false);
      }
    }
    return (
      <div className="flex gap-2">
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

  const flaggedPosts = Array.isArray(posts)
    ? posts.filter((p) => p.flagged)
    : [];
  const visiblePosts = Array.isArray(posts)
    ? posts.filter((p) => {
        if (!p.flagged) return true;
        const isOwner = currentUser && p.ownerId === currentUser;
        const isAdmin = currentUserObj && currentUserObj.role === "admin";
        return isOwner || isAdmin;
      })
    : [];

  if (!currentUser) {
    return (
      <div className="py-12">
        <Card className="max-w-2xl mx-auto text-center p-8">
          <h3 className="text-lg font-semibold mb-2">
            Community is for signed-in users
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Please log in to view and participate in community discussions.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => router.push("/login")}>Sign in</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create Post Card */}
      <Card className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Share with the Community</h3>
            <p className="text-sm text-slate-600 mt-1">Start a discussion or share your experience with AI tools</p>
          </div>
          <button
            onClick={() => {
              setComposeTool(selectedTool);
              setShowCompose(true);
            }}
            className="px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Post
          </button>
        </div>
      </Card>

      {/* Top filter bar */}
      <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm text-slate-600">
              Showing: All posts{selectedTool ? ` • ${selectedTool}` : ""}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                className="border rounded px-2 py-1 text-sm w-[20rem]"
                placeholder="Search community posts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    performSearch(searchQuery);
                  }
                }}
              />
              <button
                type="button"
                className="px-3 py-1 bg-sky-600 text-white rounded text-sm"
                onClick={() => performSearch(searchQuery)}
                disabled={searching}
              >
                {searching ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                className="px-2 py-1 bg-slate-100 rounded text-sm"
                onClick={() => {
                  setSearchQuery("");
                  if (mountedRef.current) {
                    const controller = new AbortController();
                    fetchPosts(controller.signal);
                  }
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="ml-2 px-2 py-1 border rounded"
          >
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest</option>
            <option value="liked">Most liked</option>
          </select>
        </div>
      </Card>

      {/* Admin flagged posts section (admins only) */}
      {currentUserObj && currentUserObj.role === "admin" && (
        <div className="w-full">
          <Card>
            <h3 className="font-semibold">Flagged posts</h3>
            <div className="mt-3 space-y-3">
              {flaggedPosts.length === 0 && (
                <div className="text-sm text-slate-500">No flagged posts.</div>
              )}
              {flaggedPosts.map((t) => {
                const first =
                  Array.isArray(t.posts) && t.posts[0] ? t.posts[0] : null;
                const date = t.date || (first && first.date) || null;
                return (
                  <div key={`flagged-${t.id}`} className="border p-3 rounded bg-yellow-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {t.title || t.ownerName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {date ? new Date(date).toLocaleDateString() : ""} •{" "}
                          {t.ownerName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-2 py-1 bg-white border rounded text-sm"
                          onClick={() => router.push(`/community/${t.id}`)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => toggleFlag(t.id, true)}
                          disabled={isUpdatingPosts}
                        >
                          {flaggingThreadId === t.id ? "..." : "Unflag"}
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-red-700 text-white rounded text-sm ml-2"
                          onClick={() => adminDeleteThread(t.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      {first ? first.text : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Posts */}
      <div className="w-full">
        <Card>
          <h3 className="font-semibold">
            Posts {loading ? "(loading...)" : ""}
          </h3>
          <div className="mt-3 space-y-3">
            {visiblePosts.length === 0 && (
              <div className="text-sm text-slate-500">No posts found.</div>
            )}
            {visiblePosts.map((t) => {
              const first =
                Array.isArray(t.posts) && t.posts[0] ? t.posts[0] : null;
              const comments = Array.isArray(t.posts) ? t.posts.slice(1) : [];
              const date = t.date || (first && first.date) || null;
              return (
                <div key={`visible-${t.id}`} className="border p-3 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        {t.title || t.ownerName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {date ? new Date(date).toLocaleDateString() : ""} •{" "}
                        {t.ownerName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded text-sm ${
                          Array.isArray(t.likes) &&
                          t.likes.includes(currentUser)
                            ? "bg-pink-50 text-pink-600 border border-pink-100"
                            : "bg-white text-slate-700 border border-slate-100"
                        }`}
                        onClick={() => handleLike(t.id)}
                      >
                        <span>
                          {Array.isArray(t.likes) ? t.likes.length : 0}
                        </span>
                        <span className="text-xs">♥</span>
                      </button>
                      {/* admin controls: flag/unflag thread */}
                      {currentUserObj && currentUserObj.role === "admin" && (
                        <div className="flex items-center gap-2 ml-2">
                          {t.flagged ? (
                            <span className="text-sm text-red-600">
                              Flagged
                            </span>
                          ) : null}
                          <button
                            type="button"
                            className="px-2 py-1 border rounded text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => toggleFlag(t.id, !!t.flagged)}
                            disabled={isUpdatingPosts}
                          >
                            {flaggingThreadId === t.id ? "..." : (t.flagged ? "Unflag" : "Flag")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* owner-only alert when post is flagged */}
                  {t.flagged &&
                    currentUser &&
                    t.ownerId === currentUser &&
                    (!currentUserObj || currentUserObj.role !== "admin") && (
                      <div className="mt-3 p-2 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                        Your post is being flagged and is currently under review
                        by an administrator.
                      </div>
                    )}

                  <div className="mt-2 text-sm">{first ? first.text : ""}</div>
                  {t.keywords && t.keywords.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      {t.keywords.join(" • ")}
                    </div>
                  )}

                  {/* comments: show up to 3, then a view more link */}
                  <div className="mt-3 space-y-2">
                    {comments.slice(0, 3).map((c, idx) => {
                      const postIndex = c.dbIndex; // Use database index for mutations
                      if (c.deletedByAdmin) {
                        if (currentUserObj && currentUserObj.role === "admin") {
                          return (
                            <div
                              key={`${t.id}-comment-${postIndex}-${idx}`}
                              className="text-sm border rounded p-2 bg-slate-50"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-xs text-slate-500">
                                    {c.authorIsAdmin
                                      ? "admin"
                                      : c.authorName || c.author}{" "}
                                    •{" "}
                                    {c.date
                                      ? new Date(c.date).toLocaleString()
                                      : ""}{" "}
                                    •{" "}
                                    <span className="italic text-red-600">
                                      deleted by admin
                                    </span>
                                  </div>
                                  <div className="mt-1 italic text-slate-500">{c.deletedText || ""}</div>
                                </div>
                                <button
                                  className="text-xs text-green-600 hover:text-green-700 px-2 py-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    adminRecoverComment(t.id, postIndex);
                                  }}
                                >
                                  Recover
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={`${t.id}-comment-${postIndex}-${idx}`}
                            className="text-sm border rounded p-2 bg-slate-50"
                          >
                            <div className="text-xs text-slate-500">
                              Comment deleted by admin
                            </div>
                          </div>
                        );
                      }
                      const commentLikes = Array.isArray(c.likes)
                        ? c.likes
                        : [];
                      const isLikedByCurrentUser =
                        currentUser && commentLikes.includes(currentUser);

                      return (
                        <div
                          key={`${t.id}-comment-${postIndex}-${idx}`}
                          className="text-sm border rounded p-2 bg-slate-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-xs text-slate-500">
                                {c.authorIsAdmin
                                  ? "admin"
                                  : c.authorName || c.author}{" "}
                                • {c.date ? new Date(c.date).toLocaleString() : ""}
                              </div>
                              <div className="mt-1">{c.text}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLikeComment(t.id, postIndex)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                  isLikedByCurrentUser
                                    ? "text-pink-600 bg-pink-50 hover:bg-pink-100"
                                    : "text-slate-500 hover:bg-slate-100"
                                }`}
                                title={
                                  isLikedByCurrentUser
                                    ? "Unlike comment"
                                    : "Like comment"
                                }
                              >
                                <span>♥</span>
                                {commentLikes.length > 0 && (
                                  <span>{commentLikes.length}</span>
                                )}
                              </button>
                              {currentUserObj &&
                                currentUserObj.role === "admin" && (
                                  <button
                                    className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      adminDeleteComment(t.id, postIndex);
                                    }}
                                  >
                                    Delete
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {comments.length > 3 && (
                      <div>
                        <a
                          className="text-sm text-sky-600 hover:underline"
                          href={`/community/${t.id}`}
                        >
                          View more ({comments.length})
                        </a>
                      </div>
                    )}

                    <CommentBox threadId={t.id} onPosted={() => {
                      if (mountedRef.current) {
                        const controller = new AbortController();
                        fetchPosts(controller.signal);
                      }
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCompose(false)}
          />
          <Card className="z-10 w-full max-w-2xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Write a post</h3>
              <button
                onClick={() => setShowCompose(false)}
                className="text-slate-500"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(e) => {
                submitReview(e);
                setShowCompose(false);
              }}
              className="mt-4 flex flex-col gap-3"
            >
              <Input
                placeholder="Post title"
                value={form.title}
                onChange={(e) =>
                  setForm((s) => ({ ...s, title: e.target.value }))
                }
              />

              <div>
                <label className="text-sm">Tool</label>
                <select
                  className="ml-2 px-2 py-1 border rounded w-full mt-1"
                  value={composeTool || ""}
                  onChange={(e) => setComposeTool(e.target.value || null)}
                >
                  <option value="">(No tool)</option>
                  {Array.isArray(tools) &&
                    tools.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <textarea
                rows={5}
                placeholder="Write your post"
                className="border p-2 rounded"
                value={form.text}
                onChange={(e) =>
                  setForm((s) => ({ ...s, text: e.target.value }))
                }
              />

              <div className="flex justify-end">
                <Button type="submit">Post</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
