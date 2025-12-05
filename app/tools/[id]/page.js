"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Button } from "../../../components/ui";

export default function ToolReviewPage() {
  const params = useParams();
  const id = params?.id;
  const [tool, setTool] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [filterStar, setFilterStar] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);

  // get the most recent history entry (by date)
  const getLatestHistory = (r) => {
    if (!Array.isArray(r.history) || r.history.length === 0) return null;
    return r.history.reduce((best, h) => {
      if (!best) return h;
      return new Date(h.date) > new Date(best.date) ? h : best;
    }, null);
  };

  // determine the rating for a review, preferring explicit review.rating,
  // otherwise using the most recent history entry's rating when available.
  const getRating = (r) => {
    if (typeof r.rating !== "undefined" && r.rating !== null) return r.rating;
    const latest = getLatestHistory(r);
    if (
      latest &&
      typeof latest.rating !== "undefined" &&
      latest.rating !== null
    )
      return latest.rating;
    return null;
  };

  // format ISO date strings to the user's local date/time
  const formatDate = (iso) => {
    try {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toLocaleString();
    } catch (e) {
      return String(iso);
    }
  };

  const getUserId = () => {
    try {
      const raw = localStorage.getItem("mock_auth");
      if (!raw) return "anon";
      const parsed = JSON.parse(raw);
      return parsed.user?.id || "anon";
    } catch (e) {
      return "anon";
    }
  };

  const storageKey = () => `bookmarks:${getUserId()}`;

  const toggleBookmark = () => {
    try {
      const key = storageKey();
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      let next;
      if (arr.includes(id)) {
        next = arr.filter((toolId) => toolId !== id);
      } else {
        next = [...arr, id];
      }
      localStorage.setItem(key, JSON.stringify(next));
      setBookmarked(next.includes(id));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          newValue: JSON.stringify(next),
        })
      );
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey());
      const arr = raw ? JSON.parse(raw) : [];
      setBookmarked(arr.includes(id));
    } catch (e) {
      setBookmarked(false);
    }
    function onStorage(e) {
      if (e.key === storageKey()) {
        try {
          const arr = e.newValue ? JSON.parse(e.newValue) : [];
          setBookmarked(arr.includes(id));
        } catch (err) {
          setBookmarked(false);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      try {
        const tres = await fetch(`/api/tools`);
        if (!tres.ok) return;
        const tdata = await tres.json();
        const arr = Array.isArray(tdata) ? tdata : tdata.tools || [];
        const found = arr.find((t) => t.id === id);
        if (!mounted) return;
        setTool(found || null);

        const rres = await fetch(`/api/reviews?tool=${encodeURIComponent(id)}`);
        if (!rres.ok) return;
        const rdata = await rres.json();
        const rar = Array.isArray(rdata) ? rdata : rdata.reviews || [];
        if (!mounted) return;
        setReviews(rar);
      } catch (e) {
        // ignore
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!id) return <div className="p-6">Missing tool id</div>;

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{tool?.name || id}</h2>
              <p className="text-sm text-slate-600 mt-2">{tool?.about}</p>
            </div>

            {/* Prominent Bookmark Button */}
            <button
              onClick={toggleBookmark}
              aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
              className="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-slate-100 transition-colors group"
              title={bookmarked ? "Remove from bookmarks" : "Bookmark this tool"}
            >
              {bookmarked ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-8 h-8 text-emerald-600"
                  fill="currentColor"
                >
                  <path d="M6 2a1 1 0 0 0-1 1v18l7-4 7 4V3a1 1 0 0 0-1-1H6z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-8 h-8 text-slate-400 group-hover:text-slate-600"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z"
                  />
                </svg>
              )}
              <span className="text-xs text-slate-600 font-medium">
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </span>
            </button>
          </div>

          {/* Quick summary, tags and how-to (show same details as the modal) */}
          {tool?.summary && (
            <div className="mt-4">
              <h5 className="text-sm font-semibold">Quick summary</h5>
              <p className="text-sm text-slate-700">{tool.summary}</p>
            </div>
          )}

          {Array.isArray(tool?.tags) && tool.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tool.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {tool?.howTo && (
            <div className="mt-4">
              <h5 className="text-sm font-semibold">How to</h5>
              {Array.isArray(tool.howTo) ? (
                <ol className="list-decimal ml-5 text-sm text-slate-700">
                  {tool.howTo.map((step, si) => (
                    <li key={si}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-700">{tool.howTo}</p>
              )}
            </div>
          )}

          <div className="mt-6">
            <h4 className="font-semibold">All reviews</h4>
            <div className="mt-3">
              {/** Star filter controls */}
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1 rounded ${
                    filterStar === null
                      ? "bg-sky-600 text-white"
                      : "bg-sky-100 text-sky-700"
                  }`}
                  onClick={() => setFilterStar(null)}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map((n) => {
                  const getRating = (r) => {
                    if (typeof r.rating !== "undefined" && r.rating !== null)
                      return r.rating;
                    if (Array.isArray(r.history) && r.history.length > 0) {
                      const last = r.history[r.history.length - 1];
                      if (last && typeof last.rating !== "undefined")
                        return last.rating;
                    }
                    return null;
                  };
                  const count = reviews.filter(
                    (r) => getRating(r) === n
                  ).length;
                  return (
                    <button
                      key={n}
                      className={`px-3 py-1 rounded flex items-center gap-2 ${
                        filterStar === n
                          ? "bg-amber-400 text-white"
                          : "bg-amber-100 text-amber-700"
                      }`}
                      onClick={() =>
                        setFilterStar((prev) => (prev === n ? null : n))
                      }
                    >
                      <span className="font-semibold">{n}★</span>
                      <span className="text-xs text-slate-600">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-4">
                {reviews.length === 0 && (
                  <div className="text-sm text-slate-500">No reviews yet.</div>
                )}

                {(() => {
                  const filtered = filterStar
                    ? reviews.filter((r) => getRating(r) === filterStar)
                    : reviews;

                  return filtered.map((r, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">
                            {r.authorDisplay || r.author}
                          </div>
                          {/* show star rating if present */}
                          {typeof getRating(r) === "number" &&
                            getRating(r) !== null && (
                              <div
                                className="text-amber-400 text-sm"
                                aria-hidden
                              >
                                {Array.from({ length: 5 }).map((_, si) => (
                                  <span key={si} className="text-base">
                                    {si < getRating(r) ? "★" : "☆"}
                                  </span>
                                ))}
                                <span className="sr-only">
                                  {getRating(r)} out of 5
                                </span>
                              </div>
                            )}
                        </div>
                        <div className="text-sm text-slate-500">
                          {formatDate(r.date)}
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-slate-700">
                        {Array.isArray(r.history) && r.history.length > 0 ? (
                          <div className="space-y-3">
                            {[...r.history]
                              .sort(
                                (a, b) => new Date(b.date) - new Date(a.date)
                              )
                              .map((h, idx) => (
                                <div key={idx} className="text-sm">
                                  <div className="flex items-center gap-3">
                                    {idx > 0 && (
                                      <div className="text-xs text-slate-400 font-semibold">
                                        UPDATE
                                      </div>
                                    )}
                                    <div className="text-xs text-slate-500">
                                      {formatDate(h.date)}
                                    </div>
                                    {(() => {
                                      // show rating only if the history entry explicitly has one (now as text)
                                      if (
                                        typeof h.rating !== "undefined" &&
                                        h.rating !== null
                                      ) {
                                        return (
                                          <div className="text-sm text-slate-600">
                                            Rating: {h.rating}/5
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  <div className="mt-1">{h.text}</div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div>{r.text}</div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="mt-6">
              <a href="/tools" className="text-sm text-slate-500">
                Back to tools
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
