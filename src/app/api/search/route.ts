// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer } from "@/lib/supabaseServer";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MATCH_COUNT = parseInt(
  process.env.PROJECTAJ_DEFAULT_MATCH_COUNT || "5",
  10
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || "").toString().trim();
    const matchCount = body.matchCount || DEFAULT_MATCH_COUNT;

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

    // 2. Call the Postgres function match_diary_pages
    const { data, error } = await supabaseServer.rpc("match_diary_pages", {
      query_embedding: embedding,
      match_count: matchCount,
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ results: data ?? [] });
  } catch (err: any) {
    console.error("Search route error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

