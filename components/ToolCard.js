"use client";

import Image from "next/image";
import React from "react";
import { Card, Button } from "./ui";
import { useAuth } from "./AuthContext";
import { useBookmarks } from "./BookmarkContext";

export default function ToolCard({ tool, onOpen }) {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(tool.id);
  return (
<Card className="flex items-stretch gap-4 p-4 min-h-[260px]">
      {/*Logo */}
      <div className="flex-shrink-0">
        <img
          src={tool.logo}
          alt={tool.name}
          className="w-16 h-16 object-contain"
        />
      </div>
      {/*Main card*/}
      <div className="flex-1 flex flex-col justify-between">
        {/* Top content */}
        <div className="flex flex-col gap-3">
          {/* Header section */}
          <div className="flex items-start justify-between">
            {/* Name and About */}
            <div>
              <h4 className="font-semibold">{tool.name}</h4>
              <div className="text-sm text-slate-500">{tool.about}</div>
            </div>
            {/* Top tags */}
            <div className="text-xs text-slate-400">
              {tool.tags.slice(0, 2).join(" • ")}
            </div>
          </div>
          {/* Tool Summary */}
          <p className="text-sm text-slate-600 line-clamp-3">
            {tool.summary}
          </p>
          {/* Tags list */}
          <div className="flex flex-wrap gap-2">
            {tool.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        {/* Bottom bottons */}
        <div className="flex items-center justify-between pt-4 mt-auto">
          {/*View Details*/}
          <Button onClick={onOpen} variant="ghost" className="text-sm">
            View details
          </Button>
          {/* bookmark */}
          {user && ( // Only show if user is logged in(need to add statement that asks user to sign in if they're not so they can bookmark)
            <button
              aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
              title={bookmarked ? "Remove bookmark" : "Add bookmark"}
              onClick={() => toggleBookmark(tool.id)} // Click handler
              className="opacity-70 hover:opacity-100"
            >
              <img
                src="/icons/Bookmark.webp"
                alt="Bookmark"
                // Change Bookmark status
                className={`w-6 h-6 ${
                  bookmarked ? "opacity-100" : "opacity-50"
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </Card>

  );
}
