"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "../../components/ui";

// load tools catalog at runtime from the canonical API (database/tools/*.json)
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

  const [storeKeys, setStoreKeys] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [sort, setSort] = useState("recent");

  const [form, setForm] = useState({
    title: "",
    author: "",
    rating: 5,
    text: "",
  });
  // keywords and composer tag input removed from compose UI

  // fetch list of available tools from the canonical API (client-side)
  const tools = useToolsLoader();
  const toolIds = useMemo(
    () => (Array.isArray(tools) ? tools.map((t) => t.id) : []),
    [tools]
  );

  // popular models / companies (shown as clickable chips)
  // popular section removed

  useEffect(() => {
    // Do not auto-select a tool by default. Showing the full 'All posts' feed
    // is more useful so users see existing community content immediately.
  }, [toolIds, storeKeys]);

  useEffect(() => {
    // only fetch community data when logged in
    const auth =
      typeof window !== "undefined" && localStorage.getItem("mock_auth");
    const token = auth ? JSON.parse(auth).token : null;
    if (token) {
      setCurrentUser(token);
      fetchStoreKeys();
    }

    // listen for login/logout from other tabs
    function onStorage(e) {
      if (e.key === "mock_auth") {
        const a = e.newValue ? JSON.parse(e.newValue) : null;
        const t = a ? a.token : null;
        setCurrentUser(t);
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

  async function fetchStoreKeys() {
    try {
      const res = await fetch(`/api/community`);
      const data = await res.json();
      const ids = Array.from(
        new Set((data || []).map((r) => r.toolId).filter(Boolean))
      );
      setStoreKeys(ids);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchPosts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTool) params.set("tool", selectedTool);
      if (sort) params.set("sort", sort);
      const res = await fetch(`/api/community?${params.toString()}`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // helper: fetch reviews using explicit params (used when we change tool and keywords together)
  async function fetchReviewsWithParams(
    toolId,
    keywordsArr = [],
    sortOpt = sort
  ) {
    // allow toolId to be falsy to request the global feed
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (toolId) params.set("tool", toolId);
      if (sortOpt) params.set("sort", sortOpt);
      const res = await fetch(`/api/community?${params.toString()}`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, [selectedTool, sort]);

  function addKeyword(k) {
    // removed: tag filtering not needed
  }

  function removeKeyword(k) {
    // removed: tag filtering not needed
  }

  async function applyFilter() {
    // removed: tag filtering not needed
  }

  // popular handlers removed

  async function handleLike(reviewId) {
    try {
      const auth = localStorage.getItem("mock_auth");
      const token = auth ? JSON.parse(auth).token : null;
      if (!token) return; // must be signed in
      const headers = { "Content-Type": "application/json" };
      if (token) headers["x-user-id"] = token;
      const res = await fetch("/api/community", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "like", threadId: reviewId }),
      });
      if (res.ok) {
        // refresh posts; could update optimistically
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    // allow composer to specify a tool (composeTool) or fall back to selectedTool
    const toolToUse = composeTool || selectedTool || null;
    if (!form.text) return;
    try {
      const payload = {
        toolId: toolToUse,
        title: form.title || null,
        text: form.text,
        // keywords intentionally removed from post payload
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
      if (res.ok) {
        setForm({ title: "", author: "", rating: 5, text: "" });
        setComposeTool(null);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const [showCompose, setShowCompose] = useState(false);
  const [composeTool, setComposeTool] = useState(null);

  // small comment box component (defined inside CommunityPage)
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
        console.error(e);
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

  // tag filtering removed — no availableKeywords

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
      {/* Top filter bar */}
      <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm text-slate-600">
              Showing: All posts{selectedTool ? ` • ${selectedTool}` : ""}
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

      {/* tag filtering removed */}

      {/* popular section removed */}

      {/* Posts column - match top filter box width (full width of content area) */}
      <div className="w-full">
        <Card>
          <h3 className="font-semibold">
            Posts {loading ? "(loading...)" : ""}
          </h3>
          <div className="mt-3 space-y-3">
            {posts.length === 0 && (
              <div className="text-sm text-slate-500">No posts found.</div>
            )}
            {posts.map((t) => {
              const first =
                Array.isArray(t.posts) && t.posts[0] ? t.posts[0] : null;
              const comments = Array.isArray(t.posts) ? t.posts.slice(1) : [];
              const date = t.date || (first && first.date) || null;
              return (
                <div key={t.id} className="border p-3 rounded">
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
                    </div>
                  </div>

                  <div className="mt-2 text-sm">{first ? first.text : ""}</div>
                  {t.keywords && t.keywords.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      {t.keywords.join(" • ")}
                    </div>
                  )}

                  {/* comments: show up to 3, then a view more link */}
                  <div className="mt-3 space-y-2">
                    {comments.slice(0, 3).map((c, idx) => (
                      <div
                        key={idx}
                        className="text-sm border rounded p-2 bg-slate-50"
                      >
                        <div className="text-xs text-slate-500">
                          {c.author} •{" "}
                          {c.date ? new Date(c.date).toLocaleString() : ""}
                        </div>
                        <div className="mt-1">{c.text}</div>
                      </div>
                    ))}

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

                    <CommentBox threadId={t.id} onPosted={() => fetchPosts()} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Floating compose button */}
      <button
        aria-label="Create post"
        onClick={() => {
          setComposeTool(selectedTool);
          setShowCompose(true);
        }}
        className="fixed bottom-6 right-6 bg-violet-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-2xl hover:bg-violet-700 transition"
      >
        +
      </button>

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

              {/* keywords removed from compose UI */}

              {/* star rating control */}
              <div className="flex gap-2 items-center">
                <label className="text-sm">Rating</label>
                <div className="flex items-center gap-1 ml-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((s) => ({ ...s, rating: n }))}
                      className={`text-xl ${
                        n <= (form.rating || 0)
                          ? "text-amber-400"
                          : "text-slate-300"
                      }`}
                      aria-label={`Set rating ${n}`}
                    >
                      {n <= (form.rating || 0) ? "★" : "☆"}
                    </button>
                  ))}
                </div>
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
