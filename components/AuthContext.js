"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Create a context to hold authentication data and actions
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // current logged-in user
  const [initialized, setInitialized] = useState(false); // flag for initial load

  // On first render, try loading saved user data from localStorage
  useEffect(() => {
    try {
      const savedUser = typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (_) {
      // ignore JSON parse errors
    } finally {
      setInitialized(true);
    }
  }, []);

  // When user changes, save stored data
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem("authUser", JSON.stringify(user));
    } catch (_) {
      // ignore localStorage errors
    }
  }, [user]);

  // Handle new account creation
  function signup({ name, email, password }) {
    if (!email || !password) throw new Error("Email and password are required.");

    const usersKey = "users";
    const existing = JSON.parse(localStorage.getItem(usersKey) || "[]");

    // Prevent duplicate accounts
    if (existing.find((u) => u.email === email)) {
      throw new Error("Account already exists.");
    }

    const username = name || email.split("@")[0];
    const newUser = { username, email, password };

    // Save new user
    localStorage.setItem(usersKey, JSON.stringify([...existing, newUser]));
    setUser({ username: newUser.username, email: newUser.email });
  }

  // Handle user login
  function login({ email, password }) {
    const usersKey = "users";
    const existing = JSON.parse(localStorage.getItem(usersKey) || "[]");
    const found = existing.find((u) => u.email === email && u.password === password);

    if (!found) throw new Error("Invalid credentials.");

    setUser({ username: found.username || found.name, email: found.email });
  }

  // Log the user out and clear stored session
  function logout() {
    setUser(null);
    try {
      localStorage.removeItem("authUser");
    } catch (_) {
      // ignore storage errors
    }
  }

  // Memoize context value for performance
  const value = useMemo(
    () => ({ user, login, signup, logout, initialized }),
    [user, initialized]
  );

  // Provide authentication context to all children
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for easy access 
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
