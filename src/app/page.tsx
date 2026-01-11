// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DiaryResult = {
  id: string;
  page_id: string;
  segment_date: string | null;
  text: string;
  similarity: number;
};

export default function HomePage() {
  const router = useRouter();
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
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="w-full border-b border-slate-900/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-semibold tracking-tight">
            ProjectAJ
          </div>
          <nav className="flex gap-4 text-xs text-slate-400">
            <Link href="/entries" className="hover:text-slate-100 transition-colors">
              Entries
            </Link>
            <Link href="/about" className="hover:text-slate-100 transition-colors">
              About
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Hero section */}
          <section className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              An AI memory for your handwritten diary.
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
              Scan your physical journals, transcribe them with AI, and search
              your past like a personal knowledge graph. ProjectAJ turns years of
              pages into a living, searchable memory.
            </p>
          </section>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your past (e.g. 'times I was grateful')"
              className="flex-1 rounded-lg px-3 py-2 bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:ring focus:ring-sky-500/40"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg px-4 py-2 bg-sky-500 text-sm font-medium disabled:opacity-60 hover:bg-sky-600 transition-colors"
              >
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/upload")}
                className="rounded-lg px-4 py-2 bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Upload page
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Search results */}
          <div className="space-y-4">
            {results.map((r) => {
              const date = r.segment_date
                ? new Date(r.segment_date).toDateString()
                : "Unknown date";

              return (
                <div
                  key={r.id}
                  className="border border-slate-800 rounded-lg bg-slate-900/60 p-4"
                >
                  <Link
                    href={`/entries/${r.page_id}`}
                    className="block hover:bg-slate-800/60 rounded-md -m-2 p-2 transition-colors"
                  >
                    <div className="text-xs text-slate-400 mb-1">
                      {date}
                      {" · "}
                      {(r.similarity ?? 0).toFixed(3)}
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-slate-100">
                      {r.text}
                    </pre>
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
      </div>
    </main>
  );
}

