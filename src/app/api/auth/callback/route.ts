// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const accessToken = requestUrl.searchParams.get("access_token");
  const refreshToken = requestUrl.searchParams.get("refresh_token");

  const res = NextResponse.redirect(new URL("/entries", requestUrl.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, {
              ...options,
              httpOnly: options?.httpOnly ?? true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });
          });
        },
      },
    }
  );

  // Handle tokens from query params
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error("Set session error:", error);
      return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin));
    }

    console.log("Session set server-side from tokens, redirecting to /entries");
    return res;
  }

  // Handle code-based flow (PKCE)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Exchange error:", error);
      return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin));
    }

    console.log("Session set server-side from code, redirecting to /entries");
    return res;
  }

  // No code or tokens
  return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
}

