// app/api/entries/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServerAuthed } from "@/lib/supabaseServerAuthed";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: entryId } = await params;

  const supabase = await supabaseServerAuthed();
  const { data: userRes } = await supabase.auth.getUser();

  if (!userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clean_text = (body?.clean_text ?? "").toString();
  const alsoUpdateRaw = !!body?.also_update_raw_text;

  if (clean_text.trim().length < 1) {
    return NextResponse.json(
      { error: "clean_text cannot be empty" },
      { status: 400 }
    );
  }

  // 1) Generate embedding for updated text
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: clean_text,
  });

  const embedding = emb.data?.[0]?.embedding;
  if (!embedding) {
    return NextResponse.json(
      { error: "Failed to generate embedding" },
      { status: 500 }
    );
  }

  // 2) Update row (RLS ensures only owner can update)
  const updatePayload: any = {
    clean_text,
    embedding,
    // updated_at handled by trigger if you added it; otherwise uncomment:
    // updated_at: new Date().toISOString(),
  };
  if (alsoUpdateRaw) updatePayload.raw_text = clean_text;

  const { data, error } = await supabase
    .from("diary_pages")
    .update(updatePayload)
    .eq("id", entryId)
    .select("id, clean_text, raw_text, updated_at")
    .single();

  if (error) {
    // If user doesn't own it, RLS can cause "0 rows" behavior depending on client.
    return NextResponse.json(
      { error: "Update failed", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ entry: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: entryId } = await params;

  const supabase = await supabaseServerAuthed();
  const { data: userRes } = await supabase.auth.getUser();

  if (!userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1) Fetch the row first (RLS ensures only owner can see it)
  const { data: row, error: fetchErr } = await supabase
    .from("diary_pages")
    .select("id, image_path")
    .eq("id", entryId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2) Delete the DB row (RLS ensures only owner can delete)
  const { error: delErr } = await supabase
    .from("diary_pages")
    .delete()
    .eq("id", entryId);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  // 3) Optional: delete the uploaded file from Supabase Storage
  if (row.image_path) {
    try {
      await supabaseAdmin.storage.from("diary-pages").remove([row.image_path]);
    } catch (storageErr) {
      // Log but don't fail the request if storage deletion fails
      console.error("Failed to delete storage file:", storageErr);
    }
  }

  return NextResponse.json({ ok: true });
}

