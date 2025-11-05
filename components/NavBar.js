"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui";
import LanguageIcon from "./LanguageIcon";

export default function NavBar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

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

    // initial read
    read();

    // react to storage changes from other tabs/windows
    function onStorage(e) {
      if (e.key === "mock_auth") read();
    }
    window.addEventListener("storage", onStorage);

    // cleanup
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [pathname]);

  function logout() {
    localStorage.removeItem("mock_auth");
    setUser(null);
    // reload to reflect state
    window.location.href = "/";
  }

  return (
    <nav className="mb-6">
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
            <Link href="/community">
              <Button variant="ghost" className="text-sm">
                Community
              </Button>
            </Link>
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
                Translate
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
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

          <LanguageIcon />
        </div>
      </div>
    </nav>
  );
}
