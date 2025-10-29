"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toolsData from "../../data/tools.json";
import SearchBar from "../../components/SearchBar";
import ToolCard from "../../components/ToolCard";
import ToolModal from "../../components/ToolModal";

export default function ToolsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTool, setActiveTool] = useState(null);
  const [recommendedIds, setRecommendedIds] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);

  // We no longer rely on client-side fallback filtering. The server/Gemini
  // provides all recommendations. Keep a trivial memo for compatibility.
  const filtered = useMemo(() => toolsData, []);

  // Explicit displayed tools state to avoid any render-order timing issues
  const [displayedTools, setDisplayedTools] = useState(toolsData);

  // Fetch recommendations from the server (Gemini). Called manually via the Search button.
  async function fetchRecommendations(q, { signal } = {}) {
    if (!q || q.trim() === "") {
      setRecommendedIds(null);
      setRecommendationError(null);
      setLoadingRecommendations(false);
      return;
    }

    setRecommendationError(null);
    setLoadingRecommendations(true);

    try {
      // clear displayed tools while fetching to show loading state
      setDisplayedTools([]);
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal,
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const ids = data.map((d) => d.id).filter(Boolean);

        setRecommendedIds(ids);
        // set displayed tools immediately
        setDisplayedTools(toolsData.filter((t) => ids.includes(t.id)));
      } else {
        setRecommendedIds([]);
        setDisplayedTools([]);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      setRecommendationError(String(err));
      setRecommendedIds([]);
      setDisplayedTools([]);
    } finally {
      setLoadingRecommendations(false);
    }
  }

  // No live/debounced search: only search when the user presses the Search button.

  function handleQueryChange(value) {
    setQuery(value);
    setRecommendationError(null);
  }

  // provide a manual search trigger (Search button) that calls the same API
  function handleSearch(value) {
    const q = typeof value === "string" && value.trim() !== "" ? value : query;

    // update parent query state to reflect what is being searched
    if (q !== query) setQuery(q);
    // clear previous recommendations while fetching
    setRecommendedIds(null);
    fetchRecommendations(q);
  }

  // If the page was opened with a query param (navigated from home), run
  // a search automatically on mount so users see results immediately.
  useEffect(() => {
    if (initialQuery && initialQuery.trim() !== "") {
      // ensure the displayed query matches the initialQuery
      if (initialQuery !== query) setQuery(initialQuery);
      // kick off the fetch once
      fetchRecommendations(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6"> 
      <div className="card">
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          onSearch={handleSearch}
        />
      </div>

      <section>
        <div className="mb-4 text-sm text-slate-600">
          {loadingRecommendations
            ? "Searching..."
            : `Showing ${displayedTools.length} tool(s)`}
          {recommendationError && (
            <div className="text-red-500 text-sm">
              Error: {recommendationError}
            </div>
          )}
          {recommendedIds && recommendedIds.length === 0 && (
            <div className="text-sm text-slate-500">
              No AI recommendations returned.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayedTools.map((t) => (
            <ToolCard key={t.id} tool={t} onOpen={() => setActiveTool(t)} />
          ))}
        </div>
      </section>

      {activeTool && (
        <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />
      )}
    </div>
  );
}
