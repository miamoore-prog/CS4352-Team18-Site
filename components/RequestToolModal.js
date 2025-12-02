"use client";

import { useState, useEffect } from "react";
import { Card, Button } from "./ui";

export default function RequestToolModal({ onClose }) {
  const [toolName, setToolName] = useState("");
  const [usage, setUsage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const getUserId = () => {
    try {
      const raw = localStorage.getItem("mock_auth");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.token || null;
    } catch (e) {
      return null;
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    try {
      const headers = { "Content-Type": "application/json" };
      const uid = getUserId();
      if (uid) headers["x-user-id"] = uid;
      const res = await fetch("/api/tool-requests", {
        method: "POST",
        headers,
        body: JSON.stringify({ toolName, usage, contact }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setStatus({ ok: true, msg: "Request submitted successfully!" });
      setToolName("");
      setUsage("");
      setContact("");

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setStatus({ ok: false, msg: String(err) });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />

      <Card className="max-w-2xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Request a New Tool</h3>
            <p className="text-sm text-slate-600 mt-1">
              Tell us the tool name, what it is used for, and how we can contact
              you.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-3xl leading-none font-light"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {status && (
          <div
            className={`p-3 rounded-lg ${
              status.ok
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tool Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              placeholder="e.g., ChatGPT, Midjourney"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              What is it used for / context{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              placeholder="Describe what this tool does and why you need it..."
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contact Info (optional)
            </label>
            <input
              className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              placeholder="Email or other contact method"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Submit Request</Button>
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
