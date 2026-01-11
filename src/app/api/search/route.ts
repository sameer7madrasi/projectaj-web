// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServerAuthed } from "@/lib/supabaseServerAuthed";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MIN_SIMILARITY = parseFloat(
  process.env.PROJECTAJ_MIN_SIMILARITY || "0.35"
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServerAuthed();
    const { data: userRes } = await supabase.auth.getUser();

    if (!userRes.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const query = (body.query || "").toString().trim();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // 1. Create embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const [embedding] = embeddingResponse.data[0].embedding
      ? [embeddingResponse.data[0].embedding]
      : [[]];

    // 2. Call the Postgres function match_diary_segments
    const { data, error } = await supabase.rpc("match_diary_segments", {
      query_embedding: embedding,
      match_threshold: MIN_SIMILARITY,
      match_count: 20,
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    const rawResults = (data as any[]) || [];

    // Group results by date
    const grouped: Record<string, any[]> = {};
    for (const r of rawResults) {
      const key = r.segment_date ?? "unknown";
      grouped[key] = grouped[key] || [];
      grouped[key].push(r);
    }

    return NextResponse.json({ grouped, results: rawResults });
  } catch (err: any) {
    console.error("Search route error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

