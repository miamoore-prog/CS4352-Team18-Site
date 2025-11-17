"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import CarouselCard from "../components/CarouselCard";

import SearchBar from "../components/SearchBar";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tools, setTools] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setTools(data.slice(0, 6));
        else if (Array.isArray(data.tools)) setTools(data.tools.slice(0, 6));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  function onSearch(q) {
    router.push(`/tools?query=${encodeURIComponent(q)}`);
  }

  return (
    <div className="space-y-12">
      <section className="text-center space-y-6 py-8">
        <h2 className="text-4xl font-bold text-slate-800">
          AI Doesn't Have to Be Complicated.
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          We simplify the AI world for working professionals. Find the right
          tools, understand how they fit your job, and see how others like you
          are using them every day.
        </p>
      </section>

      <section className="card p-6">
        <Suspense fallback={<div>Loading tools...</div>}>
          <SearchBar
            value={query}
            onChange={(v) => setQuery(v)}
            onSearch={() => onSearch(query)}
          />
        </Suspense>
      </section>

      <section className="space-y-4">
        <h3 className="text-2xl font-semibold text-slate-800 text-center">
          Featured AI Tools
        </h3>
        <div className="card p-6 overflow-hidden">
          <div className="flex gap-5 animate-carousel w-max">
            {tools.map((tool) => (
              <CarouselCard key={`first-${tool.id}`} tool={tool} />
            ))}
            {tools.map((tool) => (
              <CarouselCard key={`second-${tool.id}`} tool={tool} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
