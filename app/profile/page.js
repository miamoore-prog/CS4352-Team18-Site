"use client";

import { useMemo } from "react";
import toolsData from "../../data/tools.json";
import { Card, Button } from "../../components/ui";
import { useAuth } from "../../components/AuthContext";
import { useBookmarks } from "../../components/BookmarkContext";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  if (!user) {
    return (
      <div className="card p-6">
        <div className="text-slate-700 mb-3">Please log in to view your profile.</div>
        <div className="flex space-x-2">
          <Link href="/login"><Button>Login</Button></Link>
          <Link href="/signup"><Button variant="secondary">Create account</Button></Link>
        </div>
      </div>
    );
  }

  const bookmarkedTools = useMemo(
    () => toolsData.filter((t) => bookmarkedIds.includes(t.id)),
    [bookmarkedIds]
  );

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-2xl font-semibold">{user.username || user.email}</h2>
        <div className="text-sm text-slate-600">{user.email}</div>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Bookmarked tools</h3>
        {bookmarkedTools.length === 0 && (
          <div className="text-sm text-slate-500">No bookmarks yet.</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bookmarkedTools.map((tool) => (
            <Card key={tool.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{tool.name}</div>
                  <div className="text-sm text-slate-600">{tool.summary}</div>
                </div>
                <Button variant="outline" onClick={() => toggleBookmark(tool.id)}>Remove</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}


