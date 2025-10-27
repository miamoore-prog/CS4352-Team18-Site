"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "../components/SearchBar";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(q) {
    // redirect to tools page with query
    router.push(`/tools?query=${encodeURIComponent(q)}`);
  }

  return (
    <div className="space-y-8">
      <section className="card">
        <h2 className="text-3xl font-bold mb-2 text-slate-800">
          Find the right AI tool
        </h2>
        <p className="text-lg text-slate-600 mb-4">
          Type what you want to learn and we'll show helpful AI tools.
        </p>

        <SearchBar
          value={query}
          onChange={(v) => setQuery(v)}
          onSearch={() => onSearch(query)}
        />
      </section>
    </div>
  );
}
