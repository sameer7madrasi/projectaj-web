// app/upload/page.tsx
"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";

type UploadStatus = "queued" | "uploading" | "done" | "failed";

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  message?: string;
  entryId?: string;
};

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [entryDate, setEntryDate] = useState<string>("");
  const [pageNumber, setPageNumber] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = items.length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const uploadingCount = items.filter((i) => i.status === "uploading").length;

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    const newItems: UploadItem[] = fileList.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "queued",
    }));

    setItems(newItems);

    // (Optional) reset input so selecting same files again works
    e.target.value = "";
  };

  const uploadSingleFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    if (entryDate) formData.append("entryDate", entryDate);
    if (pageNumber) formData.append("pageNumber", pageNumber);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.entryId || json.id;
  };

  const uploadAll = async () => {
    if (items.length === 0) return;
    setIsUploading(true);

    for (const item of items) {
      // mark uploading
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "uploading", message: "" } : p
        )
      );

      try {
        const entryId = await uploadSingleFile(item.file);
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: "done", entryId, message: "Uploaded" }
              : p
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  status: "failed",
                  message: err?.message || "Upload failed",
                }
              : p
          )
        );
      }
    }

    setIsUploading(false);
  };

  const retryFailed = async () => {
    const failed = items.filter((i) => i.status === "failed");
    if (failed.length === 0) return;

    setIsUploading(true);

    for (const item of failed) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "uploading", message: "" } : p
        )
      );

      try {
        const entryId = await uploadSingleFile(item.file);
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: "done", entryId, message: "Uploaded" }
              : p
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  status: "failed",
                  message: err?.message || "Upload failed",
                }
              : p
          )
        );
      }
    }

    setIsUploading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (items.length === 0) {
      setError("Please select one or more image files.");
      return;
    }

    try {
      // reset statuses
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          status: "queued",
          message: undefined,
          entryId: undefined,
        }))
      );

      await uploadAll();
      setMessage("Upload complete!");
      setEntryDate("");
      setPageNumber("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
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
              multiple
              onChange={handleFilesSelected}
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
            type="button"
            onClick={uploadAll}
            disabled={isUploading || items.length === 0}
            className="rounded-lg px-4 py-2 bg-sky-500 text-sm font-medium disabled:opacity-60 hover:bg-sky-600 transition-colors"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {total > 0 && (
          <div className="mt-4 text-sm text-slate-300 flex items-center gap-2">
            <span>
              {doneCount} / {total} uploaded
              {failedCount > 0 ? ` • ${failedCount} failed` : ""}
            </span>
            {isUploading && (
              <span className="inline-block animate-spin">⏳</span>
            )}
          </div>
        )}

        {failedCount > 0 && !isUploading && (
          <button
            onClick={retryFailed}
            className="mt-3 rounded-lg px-3 py-2 bg-slate-800 border border-slate-700 text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            Retry failed
          </button>
        )}

        {items.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-800 overflow-hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 border-b border-slate-800 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="text-sm text-slate-100 truncate">{item.file.name}</div>
                  {item.message && (
                    <div className="text-xs text-slate-400">{item.message}</div>
                  )}
                </div>
                <div className="text-xs">
                  {item.status === "queued" && <span className="text-slate-400">Queued</span>}
                  {item.status === "uploading" && (
                    <span className="text-sky-400 flex items-center gap-1">
                      <span className="animate-spin">⏳</span> Uploading
                    </span>
                  )}
                  {item.status === "done" && <span className="text-emerald-400">Done</span>}
                  {item.status === "failed" && <span className="text-red-400">Failed</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {message && (
          <p className="mt-4 text-sm text-emerald-400">{message}</p>
        )}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </main>
  );
}

