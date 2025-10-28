"use client";

import React from "react";
import Link from "next/link";
import { Button } from "./ui";
import { useAuth } from "./AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  return (
    <nav className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <span className="text-lg font-semibold text-slate-800">
              Reboot Required
            </span>
          </Link>

          <div className="hidden sm:flex items-center space-x-2">
            <Link href="/tools">
              <Button variant="ghost" className="text-sm">
                Tools
              </Button>
            </Link>
            <a href="#" className="text-sm text-slate-500">
              About
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!user && (
            <>
              <Link href="/login">
                <Button className="text-sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button variant="secondary" className="text-sm">Create account</Button>
              </Link>
            </>
          )}
          {user && (
            <>
              <Link href="/profile">
                <Button variant="ghost" className="text-sm">{user.username || user.email}</Button>
              </Link>
              <Button variant="outline" className="text-sm" onClick={logout}>Logout</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
