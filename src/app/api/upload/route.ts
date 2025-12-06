// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const USER_ID = process.env.PROJECTAJ_USER_ID!;
const MAIN_DIARY_ID = process.env.PROJECTAJ_MAIN_DIARY_ID!;
const BUCKET_NAME = "diary-pages";

async function fileToDataUrl(file: File): Promise<{ buffer: Buffer; dataUrl: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type || "image/jpeg";
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;
  return { buffer, dataUrl };
}

async function runOCR(imageDataUrl: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "This is a scanned handwritten diary page. " +
              "Transcribe the handwriting as accurately as possible into plain text. " +
              "Preserve the original wording. Do not summarize or add commentary.",
          },
          {
            type: "image_url",
            image_url: {
              url: imageDataUrl,
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
  });

  const text = response.choices[0]?.message?.content || "";
  return text;
}

async function createEmbedding(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: trimmed,
  });

  return res.data[0].embedding;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const entryDateStr = (formData.get("entryDate") as string | null) || null;
    const pageNumberStr = (formData.get("pageNumber") as string | null) || null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are supported for now (jpg/png/etc.)" },
        { status: 400 }
      );
    }

    // 1) Convert to buffer + data URL
    const { buffer, dataUrl } = await fileToDataUrl(file);

    // 2) Upload to Supabase Storage
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = file.name.replace(/\s+/g, "_");
    const objectPath = `${USER_ID}/${Date.now()}-${randomUUID()}.${ext}`;

    const { error: storageError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(objectPath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // 3) Run OCR via OpenAI Vision
    const rawText = await runOCR(dataUrl);
    const cleanText = rawText.trim();

    // 4) Create embedding
    const embedding = await createEmbedding(cleanText || rawText);

    // 5) Parse metadata
    const entryDate = entryDateStr && entryDateStr.length > 0 ? entryDateStr : null;
    const pageNumber =
      pageNumberStr && pageNumberStr.length > 0
        ? parseInt(pageNumberStr, 10)
        : null;

    // 6) Insert into diary_pages
    const { data, error: insertError } = await supabaseServer
      .from("diary_pages")
      .insert({
        user_id: USER_ID,
        diary_id: MAIN_DIARY_ID,
        page_number: pageNumber,
        source_file_name: file.name,
        image_path: objectPath,
        raw_text: rawText,
        clean_text: cleanText || rawText,
        entry_date: entryDate,
        embedding,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to insert diary page" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: data?.id,
        message: "Entry created successfully",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

