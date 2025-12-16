// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
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
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getSession();
  const isAuthed = !!data.session;

  const path = req.nextUrl.pathname;

  // Skip auth check for callback route
  if (path.startsWith("/auth/callback")) {
    return res;
  }

  const protectedRoutes =
    path.startsWith("/upload") ||
    path.startsWith("/entries") ||
    path.startsWith("/api/upload") ||
    path.startsWith("/api/search");

  if (protectedRoutes && !isAuthed) {
    console.log(`Middleware: Blocking ${path} - user not authenticated`);
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Optionally: redirect authed users away from /login
  if (path === "/login" && isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = "/entries";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/upload/:path*", "/entries/:path*", "/api/upload", "/api/search", "/login"],
};

