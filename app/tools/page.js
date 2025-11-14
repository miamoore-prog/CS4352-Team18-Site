"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import SearchBar from "../../components/SearchBar";
import ToolCard from "../../components/ToolCard";
import ToolModal from "../../components/ToolModal";

export default function ToolsPage() {
  const [query, setQuery] = useState("");
  const [activeTool, setActiveTool] = useState(null);
  const [recommendedIds, setRecommendedIds] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);
  const [displayedTools, setDisplayedTools] = useState([]);
  const [allTools, setAllTools] = useState([]);
  const hasSearchedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : data.tools || [];
        setAllTools(arr);

        // Only set displayedTools if there's no search query in URL
        // If there's a query, let the search effect handle displayedTools
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const hasQuery = params && params.get('query') && params.get('query').trim() !== '';
        if (!hasQuery) {
          setDisplayedTools(arr);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [displayedTools]);

  const totalPages = Math.ceil(displayedTools.length / pageSize);

  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return displayedTools.slice(start, end);
  }, [displayedTools, currentPage, pageSize]);

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
  // This effect waits for allTools to be loaded first to avoid race condition.
  useEffect(() => {
    // Only proceed if allTools has been loaded and we haven't searched yet
    if (allTools.length === 0 || hasSearchedRef.current) return;

    // read any ?query=... from the URL on client mount
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const initialQuery = params ? params.get('query') || '' : '';
      if (initialQuery && initialQuery.trim() !== '') {
        if (initialQuery !== query) setQuery(initialQuery);
        fetchRecommendations(initialQuery);
        hasSearchedRef.current = true;
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTools]);
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
          {loadingRecommendations ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              <span>Searching with AI...</span>
            </div>
          ) : (
            `Showing ${displayedTools.length} tool(s)`
          )}
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
