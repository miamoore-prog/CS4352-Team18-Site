"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui";
import LanguageIcon from "./LanguageIcon";
import GoogleTranslate from "./GoogleTranslate";

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [showTranslate, setShowTranslate] = useState(false);
  const pathname = usePathname();
  const translateRef = useRef(null); // ref for dropdown area

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

  // Close the dropdown if clicking outside
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
                Explore
              </Button>
            </Link>
            {user && (
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
            <Link href="/login">
              <Button variant="ghost" className="text-sm">
                Login
              </Button>
            </Link>

            <Link href="/translate">
              <Button variant="ghost" className="text-sm">
                Translate | 翻译 | Dịch | Traducir | Tumọ
              </Button>
            </Link>
          </div>
        </div>

        <div
          className="flex items-center space-x-4 relative"
          ref={translateRef}
        >
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

          {/* Globe icon that toggles the translator */}
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
