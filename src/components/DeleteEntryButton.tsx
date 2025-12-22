// components/DeleteEntryButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    setError(null);
    const ok = window.confirm(
      "Delete this entry permanently? This cannot be undone."
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      router.push("/entries");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={onDelete}
        disabled={deleting}
        className="rounded-lg px-3 py-2 text-xs font-medium bg-red-600/80 hover:bg-red-600 disabled:opacity-60 transition-colors"
      >
        {deleting ? "Deleting..." : "Delete entry"}
      </button>
      {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
    </div>
  );
}

