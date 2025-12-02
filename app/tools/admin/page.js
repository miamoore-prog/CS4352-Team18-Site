"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "../../../components/ConfirmDialog";

export default function AdminToolsPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    logo: "",
    about: "",
    tags: "",
    intents: "",
    primary_intent: "",
    keywords: "",
    summary: "",
    details: "",
    howTo: "",
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [msg, setMsg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    setMounted(true);

    // fetch current user
    try {
      const raw = localStorage.getItem("mock_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || null);
        return;
      }
    } catch (e) {
      // ignore and fallback to server
    }

    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user || null);
      } catch (e) {}
    }
    loadMe();
  }, []);

  async function loadTools() {
    setLoading(true);
    try {
      const headers = {};
      const raw = localStorage.getItem("mock_auth");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.token) headers["x-user-id"] = parsed.token;
        } catch (e) {}
      }
      const res = await fetch("/api/admin/tools", { headers });
      if (!res.ok) throw new Error("failed to load");
      const data = await res.json();
      setTools(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsg({ ok: false, text: String(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.role === "admin") loadTools();
  }, [user]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (editingId) {
          setEditingId(null);
          setEditForm(null);
        }
        if (showCreateModal) {
          setShowCreateModal(false);
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [editingId, showCreateModal]);

  const getHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    const raw = localStorage.getItem("mock_auth");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.token) headers["x-user-id"] = parsed.token;
      } catch (e) {}
    }
    return headers;
  };

  async function handleAdd(e) {
    e.preventDefault();
    setMsg(null);
    try {
      const payload = {
        id: form.id.trim(),
        name: form.name.trim(),
        logo: form.logo.trim() || undefined,
        about: form.about.trim(),
        summary: form.summary.trim() || undefined,
        details: form.details.trim() || undefined,
        tags: form.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        intents: form.intents
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        primary_intent: form.primary_intent || undefined,
        keywords: form.keywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        howTo: form.howTo
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await fetch("/api/admin/tools", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed to add");
      setMsg({ ok: true, text: "Tool added" });
      setForm({
        id: "",
        name: "",
        logo: "",
        about: "",
        tags: "",
        intents: "",
        primary_intent: "",
        keywords: "",
        summary: "",
        details: "",
        howTo: "",
      });
      setShowCreateModal(false);
      await loadTools();
    } catch (err) {
      setMsg({ ok: false, text: String(err) });
    }
  }

  async function toggleHidden(t) {
    setConfirmDialog({
      title: t.hidden ? "Unhide Tool" : "Hide Tool",
      message: t.hidden
        ? `Are you sure you want to make "${t.name}" visible to users again?`
        : `Are you sure you want to hide "${t.name}"? It will no longer be visible to users in the tool catalog.`,
      confirmText: t.hidden ? "Unhide" : "Hide",
      danger: !t.hidden,
      onConfirm: async () => {
        setMsg(null);
        try {
          const res = await fetch("/api/admin/tools", {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({ id: t.id, hidden: !t.hidden }),
          });
          if (!res.ok) throw new Error("failed");
          setMsg({ ok: true, text: "Updated" });
          await loadTools();
        } catch (err) {
          setMsg({ ok: false, text: String(err) });
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  }

  // Prevent hydration mismatch by waiting for client-side mount
  if (!mounted) {
    return (
      <div className="card">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card">Please sign in as admin to view this page.</div>
    );
  }
  if (user.role !== "admin") {
    return (
      <div className="card">You are not authorized to view this page.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold">Admin: Tools</h3>
        <p className="text-sm text-slate-600">
          Add or hide tools from the catalog.
        </p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Existing tools</h4>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            Create Tool
          </button>
        </div>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div className="space-y-2">
            {tools.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between border p-2 rounded"
              >
                <div>
                  <div className="font-semibold">
                    {t.name}{" "}
                    <span className="text-xs text-slate-500">({t.id})</span>
                  </div>
                  <div className="text-sm text-slate-600">{t.about}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-slate-500">
                    {t.hidden ? "hidden" : "visible"}
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={() => toggleHidden(t)}
                  >
                    {t.hidden ? "Unhide" : "Hide"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setEditingId(t.id);
                      setEditForm({
                        name: t.name || "",
                        logo: t.logo || "",
                        about: t.about || "",
                        summary: t.summary || "",
                        details: t.details || "",
                        intents: (t.intents || []).join(", "),
                        primary_intent: t.primary_intent || "",
                        tags: (t.tags || []).join(", "),
                        keywords: (t.keywords || []).join(", "),
                        howTo: (t.howTo || []).join("\n"),
                      });
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {editingId && editForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          style={{
            marginTop: 0,
          }}
          onClick={() => {
            setEditingId(null);
            setEditForm(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h4 className="font-semibold text-lg">Edit tool: {editingId}</h4>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setEditForm(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form
              className="px-6 py-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setMsg(null);
                try {
                  const payload = {
                    id: editingId,
                    name: editForm.name,
                    logo: editForm.logo,
                    about: editForm.about,
                    summary: editForm.summary,
                    details: editForm.details,
                    intents: editForm.intents
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    primary_intent: editForm.primary_intent,
                    tags: editForm.tags
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    keywords: editForm.keywords
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    howTo: editForm.howTo
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  };
                  const res = await fetch("/api/admin/tools", {
                    method: "PATCH",
                    headers: getHeaders(),
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) throw new Error("failed to save");
                  setMsg({ ok: true, text: "Saved" });
                  setEditingId(null);
                  setEditForm(null);
                  await loadTools();
                } catch (err) {
                  setMsg({ ok: false, text: String(err) });
                }
              }}
            >
              <div>
                <label className="text-sm">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Logo path</label>
                <input
                  value={editForm.logo}
                  onChange={(e) =>
                    setEditForm({ ...editForm, logo: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Or upload new logo</label>
                <div className="flex items-center gap-2">
                  <label className="inline-block bg-slate-100 px-3 py-2 rounded cursor-pointer text-sm">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files && e.target.files[0];
                        if (!f) return;
                        try {
                          const reader = new FileReader();
                          const p = await new Promise((res, rej) => {
                            reader.onload = () => res(reader.result);
                            reader.onerror = rej;
                            reader.readAsDataURL(f);
                          });
                          const m = String(p).match(/^data:(.+);base64,(.+)$/);
                          if (!m) throw new Error("invalid file data");
                          const contentType = m[1];
                          const b64 = m[2];
                          const filename = f.name || "upload.png";
                          const resp = await fetch("/api/admin/upload-image", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              filename,
                              contentType,
                              data: b64,
                            }),
                          });
                          if (!resp.ok) throw new Error("upload failed");
                          const js = await resp.json();
                          if (js && js.url) {
                            setEditForm({ ...editForm, logo: js.url });
                          }
                        } catch (err) {
                          setMsg({ ok: false, text: String(err) });
                        }
                      }}
                    />
                  </label>
                </div>
                {editForm.logo && (
                  <div className="mt-2">
                    <img
                      src={editForm.logo}
                      alt="logo"
                      className="w-16 h-16 object-contain rounded"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm">About</label>
                <input
                  value={editForm.about}
                  onChange={(e) =>
                    setEditForm({ ...editForm, about: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Summary</label>
                <input
                  value={editForm.summary}
                  onChange={(e) =>
                    setEditForm({ ...editForm, summary: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Details</label>
                <textarea
                  rows={4}
                  value={editForm.details}
                  onChange={(e) =>
                    setEditForm({ ...editForm, details: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Intents (comma separated)</label>
                <input
                  value={editForm.intents}
                  onChange={(e) =>
                    setEditForm({ ...editForm, intents: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Primary intent</label>
                <input
                  value={editForm.primary_intent}
                  onChange={(e) =>
                    setEditForm({ ...editForm, primary_intent: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Tags (comma separated)</label>
                <input
                  value={editForm.tags}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tags: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Keywords (comma separated)</label>
                <input
                  value={editForm.keywords}
                  onChange={(e) =>
                    setEditForm({ ...editForm, keywords: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="text-sm">HowTo (one step per line)</label>
                <textarea
                  rows={4}
                  value={editForm.howTo}
                  onChange={(e) =>
                    setEditForm({ ...editForm, howTo: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center gap-2 mt-4">
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditingId(null);
                    setEditForm(null);
                  }}
                >
                  Cancel
                </button>
                {msg && (
                  <span
                    className={
                      msg.ok ? "text-green-600 ml-3" : "text-red-600 ml-3"
                    }
                  >
                    {msg.text}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          style={{
            marginTop: 0,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h4 className="font-semibold text-lg">Create New Tool</h4>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form className="px-6 py-4" onSubmit={handleAdd}>
              <div className="space-y-3">
                <div>
                  <label className="text-sm">ID (slug)</label>
                  <input
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    className="w-full border p-2 rounded"
                    placeholder="e.g., chatgpt, gemini-pro, claude-ai"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm">
                    Logo (enter URL or upload file)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={form.logo}
                      onChange={(e) =>
                        setForm({ ...form, logo: e.target.value })
                      }
                      placeholder="/logos/foo.png or https://..."
                      className="flex-1 border p-2 rounded"
                    />
                    <label className="inline-block bg-slate-100 px-3 py-2 rounded cursor-pointer text-sm">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files && e.target.files[0];
                          if (!f) return;
                          setUploadingLogo(true);
                          try {
                            const reader = new FileReader();
                            const p = await new Promise((res, rej) => {
                              reader.onload = () => res(reader.result);
                              reader.onerror = rej;
                              reader.readAsDataURL(f);
                            });
                            const m = String(p).match(
                              /^data:(.+);base64,(.+)$/
                            );
                            if (!m) throw new Error("invalid file data");
                            const contentType = m[1];
                            const b64 = m[2];
                            const filename = f.name || "upload.png";
                            const resp = await fetch(
                              "/api/admin/upload-image",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  filename,
                                  contentType,
                                  data: b64,
                                }),
                              }
                            );
                            if (!resp.ok) throw new Error("upload failed");
                            const js = await resp.json();
                            if (js && js.url) {
                              setForm({ ...form, logo: js.url });
                            }
                          } catch (err) {
                            setMsg({ ok: false, text: String(err) });
                          } finally {
                            setUploadingLogo(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {uploadingLogo && (
                    <div className="text-sm text-slate-500 mt-1">
                      Uploading...
                    </div>
                  )}
                  {form.logo && (
                    <div className="mt-2">
                      <img
                        src={form.logo}
                        alt="logo"
                        className="w-16 h-16 object-contain rounded"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm">About</label>
                  <input
                    value={form.about}
                    onChange={(e) =>
                      setForm({ ...form, about: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">Summary</label>
                  <input
                    value={form.summary}
                    onChange={(e) =>
                      setForm({ ...form, summary: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">Details</label>
                  <textarea
                    rows={3}
                    value={form.details}
                    onChange={(e) =>
                      setForm({ ...form, details: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">Intents (comma separated)</label>
                  <input
                    value={form.intents}
                    onChange={(e) =>
                      setForm({ ...form, intents: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">Primary intent</label>
                  <input
                    value={form.primary_intent}
                    onChange={(e) =>
                      setForm({ ...form, primary_intent: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">Tags (comma separated)</label>
                  <input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">Keywords (comma separated)</label>
                  <input
                    value={form.keywords}
                    onChange={(e) =>
                      setForm({ ...form, keywords: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">HowTo (one step per line)</label>
                  <textarea
                    rows={3}
                    value={form.howTo}
                    onChange={(e) =>
                      setForm({ ...form, howTo: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
              </div>
              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center gap-2 mt-4 -mx-6">
                <button className="btn btn-primary" type="submit">
                  Create Tool
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                {msg && (
                  <span
                    className={
                      msg.ok ? "text-green-600 ml-3" : "text-red-600 ml-3"
                    }
                  >
                    {msg.text}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  );
}
