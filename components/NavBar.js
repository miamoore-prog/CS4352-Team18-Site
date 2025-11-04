"use client";

import React from "react";
import Link from "next/link";
import { Button } from "./ui";
import LanguageIcon from "./LanguageIcon";

export default function NavBar() {
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
          </div>
        </div>
        <div className="flex items-center">
          <LanguageIcon />
        </div>
      </div>
    </nav>
  );
}
