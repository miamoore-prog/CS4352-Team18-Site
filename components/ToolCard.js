"use client";

import Image from "next/image";
import React from "react";
import { Card, Button } from "./ui";

export default function ToolCard({ tool, onOpen }) {
  // open modal when the card is clicked (or activated via keyboard)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen?.();
    }
  };

  return (
    <Card
      className="flex items-start space-x-4 cursor-pointer"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <img src={tool.logo} alt={tool.name} className="logo" />

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold">{tool.name}</h4>
            <div className="text-sm text-slate-500">{tool.about}</div>
          </div>
          <div className="text-xs text-slate-400">
            {tool.tags.slice(0, 2).join(" • ")}
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-600">{tool.summary}</p>

        <div className="mt-3 flex items-center">
          {tool.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>

        {/* Clicking the card opens the modal — the explicit button was removed for a cleaner interaction */}
      </div>
    </Card>
  );
}
