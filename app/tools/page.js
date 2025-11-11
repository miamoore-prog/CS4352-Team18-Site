"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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

  // Explicit displayed tools state to avoid any render-order timing issues
  const [displayedTools, setDisplayedTools] = useState([]);
  // keep a full catalog so we can reset and filter deterministically
  const [allTools, setAllTools] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : data.tools || [];
        setAllTools(arr);
        setDisplayedTools(arr);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; // Number of tool cards per page

  // Automatically reset to first page when new tools are displayed
  useEffect(() => {
    setCurrentPage(1);
  }, [displayedTools]);

  // Compute total pages
  const totalPages = Math.ceil(displayedTools.length / pageSize);

  // Compute which tools to show on current page
  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return displayedTools.slice(start, end);
  }, [displayedTools, currentPage, pageSize]);

  // Fetch recommendations from the server (Gemini). Called manually via the Search button.
  async function fetchRecommendations(q, { signal } = {}) {
    if (!q || q.trim() === "") {
      setRecommendedIds(null);
      setRecommendationError(null);
      setLoadingRecommendations(false);
      setDisplayedTools(allTools);
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
        setDisplayedTools(allTools.filter((t) => ids.includes(t.id)));
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
  const sectionRef = useRef(null); //ref to the tools section

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          onSearch={handleSearch}
        />
      </div>

      <section ref={sectionRef}>
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

        {/* Display tool cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paginatedTools.map((t) => (
            <ToolCard key={t.id} tool={t} onOpen={() => setActiveTool(t)} />
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                setTimeout(() => {
                  const y =
                    sectionRef.current?.getBoundingClientRect().top +
                    window.scrollY -
                    100;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }, 0);
              }}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                setTimeout(() => {
                  const y =
                    sectionRef.current?.getBoundingClientRect().top +
                    window.scrollY -
                    100;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }, 0);
              }}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {activeTool && (
        <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />
      )}
    </div>
  );
}
