"use client";

import React, { useState, useEffect } from "react";
import { Card, Button } from "./ui";

export default function ToolModal({ tool, onClose }) {
  const [showHowTo, setShowHowTo] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/reviews?tool=${encodeURIComponent(tool.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        if (Array.isArray(data)) setReviews(data);
        else if (data && Array.isArray(data.reviews)) setReviews(data.reviews);
      } catch (e) {
        // ignore
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [tool.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />

      <Card className="max-w-2xl w-full p-6 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{tool.name}</h3>
            <p className="text-sm text-slate-600">{tool.about}</p>
          </div>
          <div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-500"
            >
              Close
            </Button>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-700">{tool.details}</div>

        {/* Reviews / ratings section (Amazon-style inspiration) */}
        <div className="mt-6">
          <h4 className="font-semibold">Customer reviews</h4>
          <div className="mt-3">
            {(() => {
              const count = reviews.length;
              const avg =
                count === 0
                  ? 0
                  : (reviews.reduce((s, r) => s + (r.rating || 0), 0) / count).toFixed(1);

              return (
                <div>
                  <div className="flex items-center">
                    <div className="text-2xl font-semibold mr-3">{avg}</div>
                    <div className="text-sm text-slate-600">{count} reviews</div>
                  </div>

                  <div className="mt-3 space-y-3 max-h-48 overflow-y-auto">
                    {count === 0 && (
                      <div className="text-sm text-slate-500">No reviews yet.</div>
                    )}

                    {reviews.map((r, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{r.authorDisplay || r.author}</div>
                          <div className="text-sm text-slate-500">{r.date || ''}</div>
                        </div>
                        <div className="text-xs text-amber-500 mt-1">{'★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0))}</div>
                        <div className="mt-2 text-sm text-slate-700">{r.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold">Tags</h4>
          <div className="mt-2">
            {tool.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Quick summary: {tool.summary}
          </div>
          <div>
            <Button onClick={() => setShowHowTo(!showHowTo)} className="mr-2">
              How to guide
            </Button>
            {/* <Button variant="ghost" onClick={onClose}>
              Done
            </Button>*/}
          </div>
        </div>

        {showHowTo && (
          <div className="mt-4 bg-slate-50 p-4 rounded-md">
            <h5 className="font-semibold">How to use {tool.name}</h5>
            <ol className="list-decimal pl-5 mt-2 text-sm text-slate-700">
              {tool.howTo.map((step, i) => (
                <li key={i} className="mb-2">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </Card>
    </div>
  );
}
