"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [storeKeys, setStoreKeys] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterKeywords, setFilterKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [sort, setSort] = useState("recent");

  const [form, setForm] = useState({
    title: "",
    author: "",
    rating: 5,
    text: "",
    keywords: [],
  });
  const [composerTagInput, setComposerTagInput] = useState("");

  // fetch list of available tools from the canonical API (client-side)
  const tools = useToolsLoader();
  const toolIds = useMemo(
    () => (Array.isArray(tools) ? tools.map((t) => t.id) : []),
    [tools]
  );

  // popular models / companies (shown as clickable chips)
  const popular = useMemo(() => {
    if (!Array.isArray(tools)) return [];
    // pick the first 6 tools as 'popular' defaults
    return tools.slice(0, 6).map((t) => ({ id: t.id, name: t.name }));
  }, [tools]);

  useEffect(() => {
    // pick first tool by default
    if (toolIds.length > 0) {
      setSelectedTool((s) => s || toolIds[0]);
    }
  }, [toolIds]);

  useEffect(() => {
    fetchStoreKeys();
  }, []);

  async function fetchStoreKeys() {
    try {
      const res = await fetch(`/api/reviews`);
      const data = await res.json();
      // API returns { reviews: [...] } — derive unique tool ids
      if (data && Array.isArray(data.reviews)) {
        const ids = Array.from(
          new Set(data.reviews.map((r) => r.toolId).filter(Boolean))
        );
        setStoreKeys(ids);
      } else {
        setStoreKeys(Object.keys(data || {}));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchReviews() {
    if (!selectedTool) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("tool", selectedTool);
      if (filterKeywords.length > 0)
        params.set("keywords", filterKeywords.join(","));
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();
      // API returns either an array (when filtered by tool) or the whole store object.
      setReviews(
        Array.isArray(data)
          ? data
          : data && data.reviews
          ? data.reviews
          : data || []
      );
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
    if (!toolId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("tool", toolId);
      if (keywordsArr.length > 0) params.set("keywords", keywordsArr.join(","));
      if (sortOpt) params.set("sort", sortOpt);

      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();
      setReviews(
        Array.isArray(data)
          ? data
          : data && data.reviews
          ? data.reviews
          : data || []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, [selectedTool]);

  function addKeyword(k) {
    if (!k) return;
    setFilterKeywords((s) => (s.includes(k) ? s : [...s, k]));
  }

  function removeKeyword(k) {
    setFilterKeywords((s) => s.filter((x) => x !== k));
  }

  async function applyFilter() {
    await fetchReviews();
  }

  // handle clicking a popular chip: set selected tool and add as keyword, then fetch with both params
  function handlePopularClick(p) {
    const newTool = p.id;
    // add the human-friendly tool name to keyword filters (so chips match availableKeywords which are names/tags)
    const newKeys = filterKeywords.includes(p.name)
      ? filterKeywords
      : [...filterKeywords, p.name];
    setSelectedTool(newTool);
    setFilterKeywords(newKeys);
    // fetch directly with computed params so state update timing doesn't block refresh
    fetchReviewsWithParams(newTool, newKeys, sort);
  }

  async function handleLike(reviewId) {
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "like",
          toolId: selectedTool,
          reviewId,
        }),
      });
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!selectedTool || !form.text) return;
    try {
      const payload = {
        toolId: selectedTool,
        // new posts use a title; keep backward compatibility by also sending author when no title
        title: form.title || null,
        author: form.author || null,
        rating: form.rating || 5,
        text: form.text,
        keywords: form.keywords,
      };
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setForm({ title: "", author: "", rating: 5, text: "", keywords: [] });
        setComposerTagInput("");
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const [showCompose, setShowCompose] = useState(false);

  // derive keyword buttons from reviews (simple heuristic)
  const availableKeywords = useMemo(() => {
    const kws = new Set();
    reviews.forEach((r) => (r.keywords || []).forEach((k) => kws.add(k)));
    // also include tags from the tools data for the selected tool
    try {
      const t = Array.isArray(tools)
        ? tools.find((x) => x.id === selectedTool)
        : null;
      if (t && t.tags) t.tags.forEach((tg) => kws.add(tg));
    } catch (e) {}
    return Array.from(kws).slice(0, 20);
  }, [reviews, selectedTool]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top filter bar */}
      <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="Filter keywords or search"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
            />
          </div>

          <Button
            onClick={() => {
              addKeyword(keywordInput);
              setKeywordInput("");
            }}
          >
            Add
          </Button>

          <Button onClick={applyFilter} variant="ghost">
            Filter
          </Button>
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

      {/* Selected keyword chips (pills) */}
      <div className="flex flex-wrap gap-2">
        {filterKeywords.map((k) => (
          <button
            key={k}
            onClick={() => removeKeyword(k)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm border transition shadow-sm hover:shadow-md bg-sky-100 text-slate-900 border-sky-200"
          >
            <span className="font-medium">{k}</span>
            <span className="text-xs text-slate-400">×</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <div className="inline-flex gap-2">
            {popular.map((p) => {
              const active =
                filterKeywords.includes(p.name) || selectedTool === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePopularClick(p)}
                  className={`px-3 py-1 rounded-md text-sm border transition shadow-sm hover:shadow-md ${
                    active
                      ? "bg-sky-100 text-slate-900 border-sky-200"
                      : "bg-white text-slate-900 border-slate-200"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          <div>
            <div className="inline-flex gap-2">
              {availableKeywords.map((k) => (
                <button
                  key={k}
                  onClick={() => addKeyword(k)}
                  className={`px-2 py-1 rounded-md text-sm border transition shadow-sm hover:shadow-md ${
                    filterKeywords.includes(k)
                      ? "bg-sky-100 text-slate-900 border-sky-200"
                      : "bg-white text-slate-900 border-slate-200"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Posts column - match top filter box width (full width of content area) */}
      <div className="w-full">
        <Card>
          <h3 className="font-semibold">
            Posts {loading ? "(loading...)" : ""}
          </h3>
          <div className="mt-3 space-y-3">
            {reviews.length === 0 && (
              <div className="text-sm text-slate-500">No posts found.</div>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="border p-3 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{r.title || r.author}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(r.date).toLocaleDateString()} • {r.rating} / 5
                    </div>
                    <div className="text-xs text-amber-500 mt-1">
                      {"★".repeat(
                        Math.max(0, Math.min(5, Math.round(r.rating || 0)))
                      ) +
                        "☆".repeat(
                          5 -
                            Math.max(0, Math.min(5, Math.round(r.rating || 0)))
                        )}
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => handleLike(r.id)}
                      className="text-sm"
                    >
                      👍 {r.likes || 0}
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm">{r.text}</div>
                {r.keywords && r.keywords.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    {r.keywords.join(" • ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Floating compose button */}
      <button
        aria-label="Create post"
        onClick={() => setShowCompose(true)}
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

              {/* quick suggested keywords for posts */}
              <div className="flex flex-wrap gap-2">
                {[
                  "review",
                  "problem solving",
                  "model issue",
                  "bug",
                  "feature request",
                ].map((k) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() =>
                      setForm((s) => ({
                        ...s,
                        keywords: s.keywords
                          ? Array.from(new Set([...s.keywords, k]))
                          : [k],
                      }))
                    }
                    className="px-2 py-1 bg-sky-50 rounded-full text-sm hover:bg-sky-100 transition"
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* tag-input UI: show tags and an input to add more */}
              <div className="border rounded p-2">
                <div className="flex flex-wrap gap-2">
                  {(form.keywords || []).map((tk) => (
                    <span
                      key={tk}
                      className="inline-flex items-center gap-2 px-2 py-1 bg-slate-100 rounded-full text-sm"
                    >
                      <span>{tk}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((s) => ({
                            ...s,
                            keywords: (s.keywords || []).filter(
                              (x) => x !== tk
                            ),
                          }))
                        }
                        className="text-xs text-slate-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    className="outline-none px-2 py-1 text-sm"
                    placeholder="Add keyword and press Enter"
                    value={composerTagInput}
                    onChange={(e) => setComposerTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const v = composerTagInput.trim().replace(/,$/, "");
                        if (v) {
                          setForm((s) => ({
                            ...s,
                            keywords: s.keywords
                              ? Array.from(new Set([...s.keywords, v]))
                              : [v],
                          }));
                          setComposerTagInput("");
                        }
                      }
                    }}
                  />
                </div>
              </div>

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
