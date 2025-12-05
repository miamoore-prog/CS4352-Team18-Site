"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input, Button } from "./ui";

export default function SearchBar({ value, onChange, onSearch }) {
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onSearch) onSearch(value);
          setFocused(false);
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              aria-label="Search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Describe what you need in natural language..."
            />
            <Button type="submit" className="text-sm">
              Go
            </Button>
          </div>
          <p className="text-xs text-muted-foreground italic px-1">
            <span className="font-semibold text-foreground/70">AI-powered search:</span> Type your query in natural language and we'll find the perfect AI tools for you
          </p>
        </div>
      </form>
    </div>
  );
}
