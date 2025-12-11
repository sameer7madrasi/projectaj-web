"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">About ProjectAJ</h1>
          <Link
            href="/"
            className="text-xs text-sky-400 hover:text-sky-300 underline transition-colors"
          >
            ← Back home
          </Link>
        </header>

        <section className="space-y-3 text-sm text-slate-300">
          <p>
            ProjectAJ is an AI-powered companion for handwritten journals. 
            Upload scanned diary pages, transcribe them with AI, and explore 
            your past through rich semantic search.
          </p>

          <p>
            If the AI cannot read a word clearly, it tags it as 
            <code className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs mx-1">
              {"<illegible>"}
            </code>
            to remain faithful to your original writing.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300">
          <h2 className="text-lg font-semibold text-slate-100">How it works</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="font-semibold">OCR:</span> Uploaded images are processed by a vision model
              to extract handwritten text.
            </li>
            <li>
              <span className="font-semibold">Storage:</span> Entries are stored securely in Supabase,
              along with metadata like dates and page numbers.
            </li>
            <li>
              <span className="font-semibold">Embeddings:</span> Each entry is vectorized to enable deep,
              semantic search.
            </li>
            <li>
              <span className="font-semibold">Search:</span> Ask natural questions to surface relevant
              memories across your entire archive.
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-slate-300">
          <h2 className="text-lg font-semibold text-slate-100">Roadmap</h2>
          <p>
            Upcoming improvements include PDF support, editing tools for
            correcting OCR mistakes, multi-entry upload, user accounts, and
            an interactive "Chat with My Diary" experience.
          </p>
        </section>
      </div>
    </main>
  );
}

