// app/upload/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [entryDate, setEntryDate] = useState<string>("");
  const [pageNumber, setPageNumber] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!file) {
      setError("Please select an image file.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (entryDate) formData.append("entryDate", entryDate);
      if (pageNumber) formData.append("pageNumber", pageNumber);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMessage("Upload complete! Entry created.");
      setFile(null);
      setEntryDate("");
      setPageNumber("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Upload Diary Page</h1>
            <p className="text-sm text-slate-400">
              Upload a scanned image of a handwritten diary page. ProjectAJ will
              transcribe, embed, and store it.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs">
            <Link
              href="/"
              className="text-sky-400 hover:text-sky-300 underline transition-colors"
            >
              Search
            </Link>
            <Link
              href="/entries"
              className="text-slate-400 hover:text-slate-200 underline transition-colors"
            >
              Recent entries
            </Link>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Diary page image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
              }}
              className="block w-full text-sm text-slate-200
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-sky-500 file:text-white
                         hover:file:bg-sky-600"
            />
            <p className="mt-1 text-xs text-slate-500">
              For now, upload JPG/PNG images (you can export from your scanner
              as images). PDF support can come later.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">Entry date (optional)</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-sky-500/40"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm mb-1">Page # (optional)</label>
              <input
                type="number"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-sky-500/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg px-4 py-2 bg-sky-500 text-sm font-medium disabled:opacity-60 hover:bg-sky-600 transition-colors"
          >
            {loading ? "Processing..." : "Upload & Ingest"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-emerald-400">{message}</p>
        )}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </main>
  );
}

