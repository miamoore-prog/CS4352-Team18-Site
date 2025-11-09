"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button } from "./ui";

export default function ToolCard({ tool, onOpen }) {
  // open modal when the card is clicked (or activated via keyboard)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen?.();
    }
  };

  const [avg, setAvg] = useState(null);
  const [count, setCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  // derive current user id from mock_auth
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
    try {
      const raw = localStorage.getItem(storageKey());
      const arr = raw ? JSON.parse(raw) : [];
      setBookmarked(arr.includes(tool.id));
    } catch (e) {
      setBookmarked(false);
    }
    function onStorage(e) {
      if (e.key === storageKey()) {
        try {
          const arr = e.newValue ? JSON.parse(e.newValue) : [];
          setBookmarked(arr.includes(tool.id));
        } catch (err) {
          setBookmarked(false);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
        const arr = Array.isArray(data) ? data : data.reviews || [];
        if (!mounted) return;
        const c = arr.length;
        const a =
          c === 0
            ? 0
            : (arr.reduce((s, r) => s + (r.rating || 0), 0) / c).toFixed(1);
        setCount(c);
        setAvg(a);
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
    <Card
      className="w-full flex items-start space-x-4 cursor-pointer hover:scale-[1.02] hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <img
        src={tool.logo}
        alt={tool.name}
        className="w-12 h-12 object-contain rounded flex-shrink-0"
      />

      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/*info*/}
        <div className="flex items-start justify-between">
          <div>
            {/*name*/}
            <h4 className="font-semibold">{tool.name}</h4>
            <div className="text-sm text-slate-500">{tool.about}</div>
          </div>
          <div className="text-xs text-slate-400 text-right">
            {/* Bookmark icon replaces top-right tags */}
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
              className="p-1 rounded hover:bg-slate-100"
              title={bookmarked ? "Bookmarked" : "Bookmark"}
            >
              {bookmarked ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-emerald-600"
                  fill="currentColor"
                >
                  <path d="M6 2a1 1 0 0 0-1 1v18l7-4 7 4V3a1 1 0 0 0-1-1H6z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-slate-400"
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
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-600">{tool.summary}</p>
        {/*summmary*/}

        <div className="mt-3 flex items-center justify-between">
          {/*Bottom tags + rating*/}
          <div className="flex items-center gap-2">
            {tool.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-700">
              <span className="font-semibold">{avg === null ? "—" : avg}</span>
              <span className="text-xs text-slate-500"> • {count} reviews</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/tools/${tool.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" onClick={(e) => e.stopPropagation()}>
                  View more
                </Button>
              </Link>

              {/* bookmark button moved to top-right */}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
