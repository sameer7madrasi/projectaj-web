// app/api/is-allowed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();

  if (!email) return NextResponse.json({ allowed: false }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("allowed_emails")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (error) return NextResponse.json({ allowed: false }, { status: 500 });

  return NextResponse.json({ allowed: !!data });
}

