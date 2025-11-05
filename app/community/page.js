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
  const toolIds = useMemo(() => Object.keys(tools), []);

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
      const t = tools[selectedTool];
      if (t && t.tags) t.tags.forEach((tg) => kws.add(tg));
    } catch (e) {}
    return Array.from(kws).slice(0, 20);
  }, [reviews, selectedTool]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-lg font-semibold">Community</h2>
        <p className="text-sm text-slate-600">Browse and contribute reviews for tools.</p>
      </Card>

      <Card>
        <div className="flex items-center gap-4">
          <label className="text-sm">Tool</label>
          <select value={selectedTool || ""} onChange={(e) => setSelectedTool(e.target.value)} className="px-3 py-2 border rounded">
            {toolIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>

          <div className="ml-4">
            <label className="text-sm">Sort</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-2 px-2 py-1 border rounded">
              <option value="recent">Recent</option>
              <option value="liked">Most liked</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm">Keywords</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableKeywords.map((k) => (
              <button key={k} onClick={() => addKeyword(k)} className="px-2 py-1 bg-slate-100 rounded text-sm">{k}</button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Input placeholder="Add keyword" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} />
            <Button onClick={() => { addKeyword(keywordInput); setKeywordInput(""); }}>Add</Button>
            <Button variant="ghost" onClick={applyFilter}>Filter</Button>
          </div>

          <div className="mt-2">
            {filterKeywords.map((k) => (
              <span key={k} className="tag mr-2">{k} <button onClick={() => removeKeyword(k)} className="ml-1 text-xs">x</button></span>
            ))}
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
