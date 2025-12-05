"use client";

import React, { useState, useEffect } from "react";
import { Card, Button } from "./ui";
import ConfirmDialog from "./ConfirmDialog";

export default function ToolModal({ tool, onClose }) {
  const [showHowTo, setShowHowTo] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingRating, setEditingRating] = useState(null);
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

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

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey());
      const arr = raw ? JSON.parse(raw) : [];
      setBookmarked(arr.includes(tool.id));
    } catch (e) {
      setBookmarked(false);
    }
  }, [tool.id]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(
          `/api/reviews?tool=${encodeURIComponent(tool.id)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        if (Array.isArray(data)) setReviews(data);
        else if (data && Array.isArray(data.reviews)) setReviews(data.reviews);
      } catch (e) {
        setReviews([]);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [tool.id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const a = localStorage.getItem("mock_auth");
      if (a) {
        try {
          const parsed = JSON.parse(a);
          setCurrentUser(parsed.token || null);
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setMyReview(null);
      setEditingText("");
      setEditingRating(null);
      setEditingEnabled(false);
      return;
    }
    const found = reviews.find(
      (r) =>
        (r.authorId && r.authorId === currentUser) ||
        (r.author && r.author === currentUser)
    );
    setMyReview(found || null);
    setEditingText(found ? found.text : "");
    setEditingRating(
      found && typeof found.rating !== "undefined" ? found.rating : null
    );
    setEditingEnabled(false);
  }, [reviews, currentUser]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />

      <Card className="max-w-2xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{tool.name}</h3>
            <p className="text-sm text-slate-600">{tool.about}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                try {
                  const key = storageKey();
                  const raw = localStorage.getItem(key);
                  const arr = raw ? JSON.parse(raw) : [];
                  let next;
                  if (arr.includes(tool.id)) {
                    next = arr.filter((id) => id !== tool.id);
                  } else {
                    next = [...arr, tool.id];
                  }
                  localStorage.setItem(key, JSON.stringify(next));
                  setBookmarked(next.includes(tool.id));
                  window.dispatchEvent(
                    new StorageEvent("storage", {
                      key,
                      newValue: JSON.stringify(next),
                    })
                  );
                } catch (err) {
                  // ignore
                }
              }}
              aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title={bookmarked ? "Remove bookmark" : "Bookmark this tool"}
            >
              {bookmarked ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-emerald-600"
                  fill="currentColor"
                >
                  <path d="M6 2a1 1 0 0 0-1 1v18l7-4 7 4V3a1 1 0 0 0-1-1H6z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-slate-400 hover:text-slate-600"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-red-600 hover:text-red-800 text-3xl leading-none font-light"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {tool.summary && (
          <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700">Quick Summary</h4>
            <p className="text-sm text-slate-600 mt-1">{tool.summary}</p>
          </div>
        )}

        <div className="mt-4 text-sm text-slate-700">{tool.details}</div>

        {/* Reviews / ratings section — show only aggregated stats (avg & count)
            and a "View Reviews" link that navigates to the tool-specific review page. */}
        <div className="mt-6">
          <h4 className="font-semibold">Customer reviews</h4>
          <div className="mt-3">
            {(() => {
              const count = reviews.length;
              const avg =
                count === 0
                  ? 0
                  : (
                      reviews.reduce((s, r) => s + (r.rating || 0), 0) / count
                    ).toFixed(1);

              return (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-semibold">{avg}</div>
                    <div className="text-sm text-slate-600">
                      {count} reviews
                    </div>
                  </div>

                  <div>
                    <a
                      href={`/tools/${tool.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost">View Reviews</Button>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Add / edit review UI */}
        <div className="mt-4 border-t pt-4">
          <h4 className="font-semibold">Your review</h4>
          {!currentUser && (
            <div className="text-sm text-slate-500">
              Please sign in to add a review.
            </div>
          )}
          {currentUser && (
            <div className="mt-2 space-y-2">
              {editingEnabled && (
                <>
                  <div>
                    <div className="text-xs text-slate-500">
                      Rating (optional)
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setEditingRating(n)}
                          className={`text-xl ${
                            n <= (editingRating || 0)
                              ? "text-amber-400"
                              : "text-slate-300"
                          }`}
                          aria-label={`Set rating ${n}`}
                        >
                          {n <= (editingRating || 0) ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    className="w-full h-auto border p-2 rounded"
                    placeholder="Write your review"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                </>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    if (!editingEnabled) {
                      setEditingEnabled(true);
                      return;
                    }

                    // Require text for submission
                    if (!editingText || !editingText.trim()) {
                      alert("Please write a review before submitting.");
                      return;
                    }

                    try {
                      const headers = { "Content-Type": "application/json" };
                      if (currentUser) headers["x-user-id"] = currentUser;
                      const res = await fetch("/api/reviews", {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                          toolId: tool.id,
                          rating: editingRating,
                          text: editingText,
                        }),
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        const rres = await fetch(
                          `/api/reviews?tool=${encodeURIComponent(tool.id)}`
                        );
                        const data = await rres.json();
                        setReviews(Array.isArray(data) ? data : []);
                        setEditingEnabled(false);
                      }
                    } catch (e) {
                      return;
                    }
                  }}
                  disabled={editingEnabled && (!editingText || !editingText.trim())}
                >
                  {editingEnabled
                    ? myReview
                      ? "Save changes"
                      : "Submit review"
                    : myReview
                    ? "Update review"
                    : "Add review"}
                </Button>

                {editingEnabled && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingEnabled(false);
                      setEditingText(myReview ? myReview.text : "");
                      setEditingRating(
                        myReview && typeof myReview.rating !== "undefined"
                          ? myReview.rating
                          : null
                      );
                    }}
                  >
                    Cancel
                  </Button>
                )}

                {myReview && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setConfirmDialog({
                        title: "Delete Review",
                        message:
                          "Are you sure you want to delete your review? This action cannot be undone.",
                        confirmText: "Delete",
                        danger: true,
                        onConfirm: async () => {
                          try {
                            const headers = {
                              "Content-Type": "application/json",
                            };
                            if (currentUser) headers["x-user-id"] = currentUser;
                            const res = await fetch("/api/reviews", {
                              method: "POST",
                              headers,
                              body: JSON.stringify({
                                toolId: tool.id,
                                action: "delete-my-review",
                              }),
                            });
                            if (res.ok) {
                              const rres = await fetch(
                                `/api/reviews?tool=${encodeURIComponent(
                                  tool.id
                                )}`
                              );
                              const data = await rres.json();
                              setReviews(Array.isArray(data) ? data : []);
                              setEditingEnabled(false);
                            }
                          } catch (e) {
                            return;
                          }
                          setConfirmDialog(null);
                        },
                        onCancel: () => setConfirmDialog(null),
                      });
                    }}
                  >
                    Delete Review
                  </Button>
                )}
              </div>
            </div>
          )}
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

        <div className="mt-6 flex items-center justify-end">
          <Button onClick={() => setShowHowTo(!showHowTo)}>
            How to guide
          </Button>
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

      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  );
}
