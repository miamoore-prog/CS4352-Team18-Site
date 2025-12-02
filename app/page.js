"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import EnhancedCarousel from "../components/EnhancedCarousel";

import SearchBar from "../components/SearchBar";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tools, setTools] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mock_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || null);
      }
    } catch (e) {
      setUser(null);
    }
  }, []);

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

      {/* Admin Dashboard - Prominently displayed for admin users */}
      {user && user.role === "admin" && (
        <section className="card p-8 bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-sky-600 text-white px-3 py-1 rounded-lg font-semibold text-sm">
              ADMIN
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Admin Dashboard</h3>
          </div>

          <p className="text-slate-600 mb-6">
            Quick access to administrative functions
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/tools/admin"
              className="group block p-6 bg-white rounded-lg border-2 border-slate-200 hover:border-sky-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-sky-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h4 className="text-lg font-semibold text-slate-800 group-hover:text-sky-600">
                  Manage Tools
                </h4>
              </div>
              <p className="text-sm text-slate-600">
                Add, edit, or remove AI tools from the database
              </p>
            </a>

            <a
              href="/community"
              className="group block p-6 bg-white rounded-lg border-2 border-slate-200 hover:border-sky-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-sky-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h4 className="text-lg font-semibold text-slate-800 group-hover:text-sky-600">
                  Manage Community
                </h4>
              </div>
              <p className="text-sm text-slate-600">
                Moderate community posts and manage discussions
              </p>
            </a>

            <a
              href="/tools/requests/admin"
              className="group block p-6 bg-white rounded-lg border-2 border-slate-200 hover:border-sky-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-sky-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <h4 className="text-lg font-semibold text-slate-800 group-hover:text-sky-600">
                  Tool Requests
                </h4>
              </div>
              <p className="text-sm text-slate-600">
                Review and manage user tool requests
              </p>
            </a>
          </div>
        </section>
      )}

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
          <EnhancedCarousel tools={tools} />
        </div>
      </section>
    </div>
  );
}
