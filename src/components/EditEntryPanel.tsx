// components/EditEntryPanel.tsx
"use client";

import { useState } from "react";

export default function EditEntryPanel({
  entryId,
  initialText,
}: {
  entryId: string;
  initialText: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alsoRaw, setAlsoRaw] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clean_text: text,
          also_update_raw_text: alsoRaw,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
        <div className="text-sm font-medium text-slate-100">Entry text</div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs rounded-md px-3 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setText(initialText);
                setError(null);
              }}
              disabled={saving}
              className="text-xs rounded-md px-3 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="text-xs rounded-md px-3 py-1 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[260px] rounded-lg px-3 py-2 bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:ring focus:ring-sky-500/40 text-slate-50"
            />
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={alsoRaw}
                onChange={(e) => setAlsoRaw(e.target.checked)}
              />
              Also overwrite raw_text (optional)
            </label>
            {error && <div className="text-xs text-red-400">{error}</div>}
            <div className="text-xs text-slate-500">
              Saving will regenerate the embedding so search improves.
            </div>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-slate-200">
            {text}
          </pre>
        )}
      </div>
    </div>
  );
}

