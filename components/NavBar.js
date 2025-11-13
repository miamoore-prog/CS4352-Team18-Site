"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui";
import LanguageIcon from "./LanguageIcon";
import GoogleTranslate from "./GoogleTranslate";
import { BookOpen, Bookmark, ChevronDown } from "lucide-react"; // Import icons

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkedTools, setBookmarkedTools] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const pathname = usePathname();
  const translateRef = useRef(null);
  const requestsRef = useRef(null);

  useEffect(() => {
    function read() {
      try {
        const raw = localStorage.getItem("mock_auth");
        if (raw) setUser(JSON.parse(raw).user || null);
        else setUser(null);
      } catch (e) {
        setUser(null);
      }
    }

    read();

    function onStorage(e) {
      if (e.key === "mock_auth") read();
    }
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [pathname]);

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

  const bookmarksKey = () => `bookmarks:${getUserId()}`;

  useEffect(() => {
    function readBookmarks() {
      try {
        const raw = localStorage.getItem(bookmarksKey());
        const arr = raw ? JSON.parse(raw) : [];
        setBookmarks(arr || []);
      } catch (e) {
        setBookmarks([]);
      }
    }
    readBookmarks();
    function onStorage(e) {
      if (e.key === bookmarksKey()) {
        try {
          const arr = e.newValue ? JSON.parse(e.newValue) : [];
          setBookmarks(arr || []);
        } catch (err) {
          setBookmarks([]);
        }
      }
      if (e.key === "mock_auth") {
        readBookmarks();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    async function loadTools() {
      if (!bookmarks || bookmarks.length === 0) {
        setBookmarkedTools([]);
        return;
      }
      try {
        const res = await fetch("/api/tools");
        if (!res.ok) return;
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.tools || [];
        const picked = arr.filter((t) => bookmarks.includes(t.id));
        if (!mounted) return;
        setBookmarkedTools(picked);
      } catch (e) {
        // ignore
      }
    }
    loadTools();
    return () => {
      mounted = false;
    };
  }, [bookmarks]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        translateRef.current &&
        !translateRef.current.contains(event.target)
      ) {
        setShowTranslate(false);
      }
    }

    if (showTranslate) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTranslate]);

  // close requests dropdown when clicking outside
  useEffect(() => {
    function onDoc(e) {
      if (requestsRef.current && !requestsRef.current.contains(e.target)) {
        setShowRequests(false);
      }
    }
    if (showRequests) document.addEventListener("mousedown", onDoc);
    else document.removeEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showRequests]);

  function logout() {
    localStorage.removeItem("mock_auth");
    setUser(null);
    window.location.href = "/";
  }

  return (
    <nav className="mb-6 relative">
      <div className="flex items-center justify-between">
        {/* LEFT SECTION */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <span className="text-lg font-semibold text-slate-800">
              AI Compass
            </span>
          </Link>

          <div className="hidden sm:flex items-center space-x-2">
            <Link href="/tools">
              <Button variant="ghost" className="text-sm">
                Explore
              </Button>
            </Link>

            {/* Requests removed from left side — moved to right side near Bookmarks */}
            {user && user.role !== "admin" && (
              <Link href="/community">
                <Button variant="ghost" className="text-sm">
                  Community
                </Button>
              </Link>
            )}

            <Link href="/about">
              <Button variant="ghost" className="text-sm">
                About
              </Button>
            </Link>

            <Link href="/articles">
              <Button
                variant="ghost"
                className="flex items-center space-x-1 text-sm"
              >
                <span>Articles</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div
          className="flex items-center space-x-4 relative"
          ref={translateRef}
        >
          {/* Bookmarks dropdown (hidden when logged out) */}
          {user && (
            <div className="relative">
            <button
              onClick={() => setShowBookmarks((v) => !v)}
              className="px-2 py-1 rounded text-sm bg-slate-100 flex items-center"
              aria-expanded={showBookmarks}
            >
              <Bookmark size={16} className="mr-2" />
              <span>
                Bookmarks{bookmarks.length ? ` (${bookmarks.length})` : ""}
              </span>
            </button>
            {showBookmarks && (
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg border rounded p-3 z-50">
                <div className="font-semibold text-sm mb-2">
                  Bookmarked tools
                </div>
                {bookmarkedTools.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No bookmarks yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookmarkedTools.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between"
                      >
                        <Link
                          href={`/tools/${t.id}`}
                          onClick={() => setShowBookmarks(false)}
                        >
                          <div className="text-sm text-slate-700">{t.name}</div>
                        </Link>
                        <div className="text-xs text-slate-400">
                          {t.tags?.slice(0, 2).join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>
          )}

          {/* Requests / Admin dropdown (click to open) placed next to bookmarks; hidden when logged out */}
          {user && (
            <div className="relative ml-2" ref={requestsRef}>
            <button
              onClick={() => setShowRequests((v) => !v)}
              className="px-2 py-1 rounded text-sm bg-slate-100 flex items-center gap-2"
              aria-expanded={showRequests}
              aria-haspopup="menu"
            >
              <span>
                {user && user.role === "admin" ? "Admin" : "Requests"}
              </span>
              <ChevronDown
                size={14}
                className={showRequests ? "transform rotate-180" : ""}
              />
            </button>
            {showRequests && (
              <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-md z-50">
                <div className="flex flex-col">
                  {user && user.role === "admin" ? (
                    <>
                      <Link
                        href="/tools/admin"
                        className="px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        Manage tools
                      </Link>
                      <Link
                        href="/community"
                        className="px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        Manage community
                      </Link>
                      <Link
                        href="/tools/requests/admin"
                        className="px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        View requests
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/tools/request"
                        className="px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        Request tool
                      </Link>
                      <Link
                        href="/tools/requests"
                        className="px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        My requests
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
            </div>
          )}

          <div>
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-slate-600">{user.displayName}</div>
                <Button variant="ghost" onClick={logout} className="text-sm">
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button className="text-sm">Login</Button>
              </Link>
            )}
          </div>

          {/* Globe icon for translator */}
          <div
            onClick={() => setShowTranslate(!showTranslate)}
            className="p-1 hover:scale-105 transition-transform"
          >
            <LanguageIcon />
          </div>

          {/* Conditional Google Translate dropdown */}
          <GoogleTranslate visible={showTranslate} />
        </div>
      </div>
    </nav>
  );
}
