// app/entries/[id]/page.tsx
import { supabaseServerAuthed } from "@/lib/supabaseServerAuthed";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditEntryPanel from "@/components/EditEntryPanel";
import DeleteEntryButton from "@/components/DeleteEntryButton";

type DiaryPage = {
  id: string;
  entry_date: string | null;
  page_number: number | null;
  created_at: string;
  source_file_name: string | null;
  clean_text: string | null;
  raw_text: string | null;
};

export const dynamic = "force-dynamic"; // always fetch fresh

async function getEntryById(id: string): Promise<DiaryPage | null> {
  try {
    const supabase = await supabaseServerAuthed();
    const { data: userRes } = await supabase.auth.getUser();

    if (!userRes.user) return null; // middleware should prevent this anyway

    const { data, error } = await supabase
      .from("diary_pages")
      .select(
        "id, entry_date, page_number, created_at, source_file_name, clean_text, raw_text"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching entry:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error in getEntryById:", err);
    return null;
  }
}

type EntryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EntryPage({ params }: EntryPageProps) {
  const { id } = await params;
  const entry = await getEntryById(id);

  if (!entry) {
    notFound();
  }

  const dateLabel = entry.entry_date
    ? new Date(entry.entry_date).toDateString()
    : "Unknown date";

  const text = entry.clean_text || entry.raw_text || "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl">
        <header className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Diary Entry</h1>
            <p className="text-xs text-slate-400">
              {dateLabel}
              {entry.page_number != null ? ` • Page ${entry.page_number}` : ""}
              {entry.source_file_name
                ? ` • Source: ${entry.source_file_name}`
                : ""}
            </p>
          </div>

          <div className="flex gap-3 text-xs">
            <Link
              href="/entries"
              className="text-sky-400 hover:text-sky-300 underline transition-colors"
            >
              ← Back to recent
            </Link>
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-200 underline transition-colors"
            >
              Search
            </Link>
          </div>
        </header>

        {text ? (
          <>
            <EditEntryPanel
              entryId={entry.id}
              initialText={entry.clean_text || entry.raw_text || ""}
            />
            <DeleteEntryButton entryId={entry.id} />
          </>
        ) : (
          <section className="border border-slate-800 rounded-lg bg-slate-900/60 p-4">
            <p className="text-sm text-slate-500">
              No text available for this entry.
            </p>
            <DeleteEntryButton entryId={entry.id} />
          </section>
        )}
      </div>
    </main>
  );
}

