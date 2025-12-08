// app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type DiaryResult = {
  id: string;
  diary_id: string;
  page_number: number | null;
  raw_text: string | null;
  clean_text: string | null;
  entry_date: string | null;
  similarity: number;
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiaryResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, matchCount: 5 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Search failed");
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">ProjectAJ</h1>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">
            Search your handwritten diary with AI.
          </p>
          <div className="flex gap-3 text-xs">
            <Link
              href="/upload"
              className="text-sky-400 hover:text-sky-300 underline transition-colors"
            >
              Upload page
            </Link>
            <Link
              href="/entries"
              className="text-slate-400 hover:text-slate-200 underline transition-colors"
            >
              Recent entries
            </Link>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your past (e.g. 'times I felt anxious about work')"
            className="flex-1 rounded-lg px-3 py-2 bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:ring focus:ring-sky-500/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg px-4 py-2 bg-sky-500 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div className="mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {results.map((r) => {
            const snippet =
              (r.clean_text || r.raw_text || "").slice(0, 300) +
              (r.clean_text && r.clean_text.length > 300 ? "..." : "");
            const date = r.entry_date
              ? new Date(r.entry_date).toDateString()
              : "Unknown date";

            return (
              <div
                key={r.id}
                className="border border-slate-800 rounded-lg bg-slate-900/60 p-4"
              >
                <Link
                  href={`/entries/${r.id}`}
                  className="block hover:bg-slate-800/60 rounded-md -m-2 p-2 transition-colors"
                >
                  <div className="text-xs text-slate-400 mb-1">
                    {date}
                    {r.page_number != null ? ` • Page ${r.page_number}` : ""}
                    {` • Score: ${r.similarity.toFixed(3)}`}
                  </div>
                  <p className="text-sm text-slate-50 whitespace-pre-wrap">
                    {snippet || (
                      <span className="text-slate-500">[No text extracted]</span>
                    )}
                  </p>
                </Link>
              </div>
            );
          })}

          {!loading && results.length === 0 && query && !error && (
            <p className="text-sm text-slate-500">
              No results. Try rephrasing your question or broadening it.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

