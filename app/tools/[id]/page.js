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
          <h2 className="text-xl font-semibold">{tool?.name || id}</h2>
          <p className="text-sm text-slate-600 mt-2">{tool?.about}</p>

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
                      ? "bg-purple-600 text-white"
                      : "bg-purple-100 text-purple-700"
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
