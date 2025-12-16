// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServerAuthed } from "@/lib/supabaseServerAuthed";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await supabaseServerAuthed();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // send user somewhere useful after login
  return NextResponse.redirect(new URL("/entries", req.url));
}

