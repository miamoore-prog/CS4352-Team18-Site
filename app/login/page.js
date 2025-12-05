"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      // store mock auth token and user in localStorage
      localStorage.setItem(
        "mock_auth",
        JSON.stringify({ token: data.token, user: data.user })
      );
      router.push("/");
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Mock Login</h2>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
            {error}. Please check your username and password.
          </div>
        )}

        <div>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary text-white px-3 py-2 shadow-sm hover:opacity-95 text-sm">
            Sign in
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-sm font-semibold mb-2 text-blue-900">Test Users</h3>
        <p className="text-sm text-blue-800">
          Use any of the following credentials to test the application:
        </p>
        <ul className="mt-2 text-sm text-blue-800 space-y-1">
          <li>• alice / test</li>
          <li>• bob / test</li>
          <li>• charlie / test</li>
          <li>• admin / adminpass</li>
        </ul>
      </div>
    </div>
  );
}
