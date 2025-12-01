"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui";
import GoogleTranslate from "./GoogleTranslate";

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkedTools, setBookmarkedTools] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const translateRef = useRef(null);
  const profileRef = useRef(null);

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

  useEffect(() => {
    function onDoc(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) document.addEventListener("mousedown", onDoc);
    else document.removeEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showProfileMenu]);

  function logout() {
    localStorage.removeItem("mock_auth");
    setUser(null);
    window.location.href = "/";
  }

  return (
    <nav className="mb-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <span className="text-lg font-semibold text-slate-800">
              AI Compass
            </span>
          </Link>

          <div className="hidden sm:flex items-center space-x-2">
            <Link href="/tools">
              <Button variant="ghost" className="text-sm">
                Tools
              </Button>
            </Link>

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

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  showProfileMenu
                    ? "bg-sky-100 text-sky-700"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="font-medium">{user.displayName}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform ${
                    showProfileMenu ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1">
                  {user.role === "admin" ? (
                    <>
                      <Link
                        href="/tools/admin"
                        className="block px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                      >
                        Manage tools
                      </Link>
                      <Link
                        href="/community"
                        className="block px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                      >
                        Manage community
                      </Link>
                      <Link
                        href="/tools/requests/admin"
                        className="block px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                      >
                        Manage tool requests
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/tools/request"
                        className="block px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                      >
                        Request tool
                      </Link>
                      <Link
                        href="/manage-profile"
                        className="block px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                      >
                        Manage Profile
                      </Link>
                    </>
                  )}
                  <div className="border-t border-slate-200 my-1"></div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button className="text-sm">Login</Button>
            </Link>
          )}

          <div className="relative" ref={translateRef}>
            <button
              onClick={() => setShowTranslate(!showTranslate)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showTranslate
                  ? "bg-sky-100 text-sky-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span className="font-medium">Language</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${
                  showTranslate ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <GoogleTranslate visible={showTranslate} />
          </div>
        </div>
      </div>
    </nav>
  );
}
