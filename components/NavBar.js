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
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const translateRef = useRef(null);
  const adminRef = useRef(null);
  const userRef = useRef(null);

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
      if (adminRef.current && !adminRef.current.contains(e.target)) {
        setShowAdminMenu(false);
      }
    }
    if (showAdminMenu) document.addEventListener("mousedown", onDoc);
    else document.removeEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showAdminMenu]);

  useEffect(() => {
    function onDoc(e) {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) document.addEventListener("mousedown", onDoc);
    else document.removeEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showUserMenu]);

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

            {user && user.role === "admin" ? (
              <div className="relative" ref={adminRef}>
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    showAdminMenu
                      ? "bg-sky-100 text-sky-700"
                      : "bg-transparent text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
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
                  <span className="font-medium">Admin</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${
                      showAdminMenu ? "rotate-180" : ""
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

                {showAdminMenu && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1">
                    <Link
                      href="/tools/admin"
                      className="block px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                    >
                      Manage Tools
                    </Link>
                    <Link
                      href="/community"
                      className="block px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                    >
                      Manage Community
                    </Link>
                    <Link
                      href="/tools/requests/admin"
                      className="block px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                    >
                      Tool Requests
                    </Link>
                  </div>
                )}
              </div>
            ) : user && user.role !== "admin" ? (
              <Link href="/community">
                <Button variant="ghost" className="text-sm">
                  Community
                </Button>
              </Link>
            ) : null}

            <Link href="/help">
              <Button variant="ghost" className="text-sm">
                Help
              </Button>
            </Link>

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
            <>
              {user.role === "admin" ? (
                // Admin: Simple welcome text + logout
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-700">Welcome,</span>
                    <span className="text-sm font-medium text-slate-800">
                      {user.displayName}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                // Normal user: Dropdown menu
                <div className="relative" ref={userRef}>
                  <div
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <span className="text-sm text-slate-700">Welcome,</span>
                    <span className="text-sm font-medium text-slate-800 group-hover:text-sky-600 transition-colors">
                      {user.displayName}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 text-slate-600 transition-transform ${
                        showUserMenu ? "rotate-180" : ""
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
                  </div>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1">
                      <Link
                        href="/manage-profile"
                        className="block px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                      >
                        Manage Profile
                      </Link>
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
              )}
            </>
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
