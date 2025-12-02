"use client";

import { useState } from "react";

export default function RequestToolPage() {
  const [toolName, setToolName] = useState("");
  const [usage, setUsage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState(null);

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
      setStatus({ ok: true, msg: "Request submitted" });
      setToolName("");
      setUsage("");
      setContact("");
    } catch (err) {
      setStatus({ ok: false, msg: String(err) });
    }
  }

  return (
    <div className="card max-w-2xl">
      <h3 className="text-lg font-semibold mb-2">Request a new tool</h3>
      <p className="text-sm text-slate-600 mb-4">
        Tell us the tool name, what it is used for, and how we can contact you.
      </p>
      {status && (
        <div className={status.ok ? "text-green-600" : "text-red-600"}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm">Tool name</label>
          <input
            className="w-full border p-2 rounded"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm">What is it used for / context</label>
          <textarea
            rows={4}
            className="w-full border p-2 rounded"
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm">Contact info (optional)</label>
          <input
            className="w-full border p-2 rounded"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-primary" type="submit">
            Submit request
          </button>
        </div>
      </form>
    </div>
  );
}
