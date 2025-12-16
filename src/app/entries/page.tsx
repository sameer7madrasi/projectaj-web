// app/entries/page.tsx
import { supabaseServerAuthed } from "@/lib/supabaseServerAuthed";
import Link from "next/link";

type DiaryPage = {
  id: string;
  entry_date: string | null;
  page_number: number | null;
  created_at: string;
  clean_text: string | null;
  raw_text: string | null;
};

export const dynamic = "force-dynamic"; // always fetch fresh

async function getRecentEntries(limit = 20): Promise<DiaryPage[]> {
  const supabase = supabaseServerAuthed();
  const { data: userRes } = await supabase.auth.getUser();

  if (!userRes.user) return []; // middleware should prevent this anyway

  const { data, error } = await supabase
    .from("diary_pages")
    .select("id, entry_date, page_number, created_at, clean_text, raw_text")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent entries:", error);
    return [];
  }

  return data ?? [];
}

export default async function EntriesPage() {
  const entries = await getRecentEntries(20);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Recent Entries</h1>
            <p className="text-sm text-slate-400">
              A quick look at your latest ingested diary pages.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-sky-400 hover:text-sky-300 underline"
          >
            ← Back to search
          </Link>
        </header>

        {entries.length === 0 && (
          <p className="text-sm text-slate-400">
            No entries found. Make sure your ingestion pipeline has inserted
            some rows into <code className="text-slate-300">diary_pages</code>.
          </p>
        )}

        <ul className="space-y-4">
          {entries.map((entry) => {
            const dateLabel = entry.entry_date
              ? new Date(entry.entry_date).toDateString()
              : "Unknown date";

            const snippetSource = entry.clean_text || entry.raw_text || "";
            const snippet =
              snippetSource.length > 220
                ? snippetSource.slice(0, 220) + "..."
                : snippetSource;

            return (
              <li
                key={entry.id}
                className="border border-slate-800 rounded-lg bg-slate-900/60 p-4"
              >
                <Link
                  href={`/entries/${entry.id}`}
                  className="block hover:bg-slate-800/60 rounded-md -m-2 p-2 transition-colors"
                >
                  <div className="text-xs text-slate-400 mb-1">
                    {dateLabel}
                    {entry.page_number != null
                      ? ` • Page ${entry.page_number}`
                      : ""}
                  </div>
                  <p className="text-sm text-slate-50 whitespace-pre-wrap">
                    {snippet || (
                      <span className="text-slate-500">[No text extracted]</span>
                    )}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

