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
      className="flex items-start space-x-4 cursor-pointer hover:scale-[1.02] hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <img src={tool.logo} alt={tool.name} className="logo" />

      <div className="flex-1 flex flex-col justify-between">
        {/*info*/}
        <div className="flex items-start justify-between">
          <div>
            {/*name*/}
            <h4 className="font-semibold">{tool.name}</h4>
            <div className="text-sm text-slate-500">{tool.about}</div>
          </div>
          <div className="text-xs text-slate-400">
            {/*Top right tags*/}
            {tool.tags.slice(0, 2).join(" • ")}
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

            <Link
              href={`/tools/${tool.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" onClick={(e) => e.stopPropagation()}>
                View more
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
