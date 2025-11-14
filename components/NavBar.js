"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui";
import LanguageIcon from "./LanguageIcon";
import GoogleTranslate from "./GoogleTranslate";
import { ChevronDown } from "lucide-react"; // Import icons

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkedTools, setBookmarkedTools] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const translateRef = useRef(null);
  const requestsRef = useRef(null);
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

  // close profile dropdown when clicking outside
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
          {/* profile dropdown on click */}
          {user && (
            <div
              className="relative"
              ref={profileRef}
            >
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-3 py-1 rounded text-sm hover:bg-slate-50"
              >
                <span className="text-sm text-slate-600">{user.displayName}</span>
              </button>

              {showProfileMenu && (
                <div 
                  className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg z-50"
                >
                  <Link href="/manage-profile" className="block px-3 py-2 hover:bg-slate-50">My Profile</Link>
                  <button onClick={logout} className="w-full text-left px-3 py-2 hover:bg-slate-50">Logout</button>
                </div>
              )}
            </div>
          )}

          {!user && (
            <Link href="/login">
              <Button className="text-sm">Login</Button>
            </Link>
          )}

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
