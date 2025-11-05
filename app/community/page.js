"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Button, Input } from "../../components/ui";
import tools from "../../data/tools.json";

export default function CommunityPage() {
  const [storeKeys, setStoreKeys] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterKeywords, setFilterKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [sort, setSort] = useState("recent");

  const [form, setForm] = useState({ author: "", rating: 5, text: "", keywords: "" });

  // fetch list of available tools from data (client-side)
  const toolIds = useMemo(() => (Array.isArray(tools) ? tools.map((t) => t.id) : []), []);

  // popular models / companies (shown as clickable chips)
  const popular = useMemo(() => {
    if (!Array.isArray(tools)) return [];
    // pick the first 6 tools as 'popular' defaults
    return tools.slice(0, 6).map((t) => ({ id: t.id, name: t.name }));
  }, []);

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
      setStoreKeys(Object.keys(data || {}));
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
      if (filterKeywords.length > 0) params.set("keywords", filterKeywords.join(","));
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();
      setReviews(data || []);
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

  async function handleLike(reviewId) {
    try {
      await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'like', toolId: selectedTool, reviewId }) });
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
        author: form.author || 'Anonymous',
        rating: form.rating || 5,
        text: form.text,
        keywords: form.keywords,
      };
      const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setForm({ author: '', rating: 5, text: '', keywords: '' });
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // derive keyword buttons from reviews (simple heuristic)
  const availableKeywords = useMemo(() => {
    const kws = new Set();
    reviews.forEach((r) => (r.keywords || []).forEach((k) => kws.add(k)));
    // also include tags from the tools data for the selected tool
    try {
      const t = Array.isArray(tools) ? tools.find((x) => x.id === selectedTool) : null;
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

          <Button onClick={() => { addKeyword(keywordInput); setKeywordInput(""); }}>
            Add
          </Button>

          <Button onClick={applyFilter} variant="ghost">
            Filter
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm">Sort</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-2 px-2 py-1 border rounded">
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest</option>
            <option value="liked">Most liked</option>
          </select>
        </div>
      </Card>

      {/* Selected keyword chips (pills) */}
      <div className="flex flex-wrap gap-2">
        {filterKeywords.map((k) => (
          <button key={k} onClick={() => removeKeyword(k)} className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm">
            <span className="font-medium">{k}</span>
            <span className="text-xs text-sky-600">×</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <div className="inline-flex gap-2">
            {popular.map((p) => (
              <button
                key={p.id}
                onClick={() => addKeyword(p.id)}
                className="px-3 py-1 bg-sky-50 rounded-full text-sm hover:bg-sky-100 transition"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div>
            <div className="inline-flex gap-2">
              {availableKeywords.map((k) => (
                <button
                  key={k}
                  onClick={() => addKeyword(k)}
                  className="px-3 py-1 bg-sky-50 rounded-full text-sm hover:bg-sky-100 transition"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold">Reviews {loading ? '(loading...)' : ''}</h3>
          <div className="mt-3 space-y-3">
            {reviews.length === 0 && <div className="text-sm text-slate-500">No reviews found.</div>}
            {reviews.map((r) => (
              <div key={r.id} className="border p-3 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{r.author}</div>
                    <div className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString()} • {r.rating} / 5</div>
                  </div>
                  <div>
                    <button onClick={() => handleLike(r.id)} className="text-sm">👍 {r.likes || 0}</button>
                  </div>
                </div>
                <div className="mt-2 text-sm">{r.text}</div>
                {r.keywords && r.keywords.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">{r.keywords.join(' • ')}</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold">Write a review</h3>
          <form onSubmit={submitReview} className="mt-4 flex flex-col gap-3">
            <Input placeholder="Your name" value={form.author} onChange={(e) => setForm((s) => ({ ...s, author: e.target.value }))} />
            <div className="flex gap-2 items-center">
              <label className="text-sm">Rating</label>
              <select value={form.rating} onChange={(e) => setForm((s) => ({ ...s, rating: Number(e.target.value) }))} className="px-2 py-1 border rounded">
                {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <textarea rows={5} placeholder="Write your review" className="border p-2 rounded" value={form.text} onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))} />
            <Input placeholder="keywords, comma separated" value={form.keywords} onChange={(e) => setForm((s) => ({ ...s, keywords: e.target.value }))} />
            <div className="flex justify-end">
              <Button type="submit">Submit review</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
