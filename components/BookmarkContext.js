"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";// import auth context to get current logged-in user

// Create context to store and manage bookmarks
const BookmarkContext = createContext(null);

//  generate storage key from user email
function getBookmarksStorageKey(email) {
  return `bookmarks:${email}`;
}

export function BookmarkProvider({ children }) {
  const { user } = useAuth(); // get current logged-in user
  const [bookmarkedIds, setBookmarkedIds] = useState([]); // store bookmarked tools

  // Load bookmarks when user changes
  useEffect(() => {
    if (!user) {
      setBookmarkedIds([]);
      return;
    }
    try {
      const saved = localStorage.getItem(getBookmarksStorageKey(user.email));
      setBookmarkedIds(saved ? JSON.parse(saved) : []);
    } catch (_) {
      setBookmarkedIds([]); // Reset bookmarks if JSON parsing fails
    }
  }, [user]);

  // Save current user's bookmarks locally
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(getBookmarksStorageKey(user.email), JSON.stringify(bookmarkedIds));
    } catch (_) {
      // ignore storage errors
    }
  }, [user, bookmarkedIds]);

  // Add or remove a bookmark for a given tool ID
  function toggleBookmark(toolId) {
    if (!user) return;
    setBookmarkedIds((prev) => {
      const exists = prev.includes(toolId);
      if (exists) return prev.filter((id) => id !== toolId);
      return [...prev, toolId];
    });
  }

  // Check if a specific tool is bookmarked
  const isBookmarked = (toolId) => bookmarkedIds.includes(toolId);

  // Memoize context value for performance
  const value = useMemo(
    () => ({ bookmarkedIds, toggleBookmark, isBookmarked }),
    [bookmarkedIds]
  );

  // Provide bookmark context to all children
  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

// Custom hook to access bookmark data and functions
export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error("Bookmarks must be used within BookmarkProvider");
  return ctx;
}