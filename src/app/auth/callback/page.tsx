// app/auth/callback/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      // Log everything for debugging
      console.log("Full URL:", window.location.href);
      console.log("Search params:", Object.fromEntries(searchParams.entries()));
      console.log("Hash:", window.location.hash);

      const code = searchParams.get("code");

      // Handle hash-based tokens (implicit flow) - Supabase sends tokens in hash
      // Hash is client-side only, so we need to extract and send to server
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        
        if (accessToken && refreshToken) {
          try {
            // Send tokens to API route to set cookies properly on server
            const response = await fetch(`/api/auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`, {
              method: "GET",
              credentials: "include",
              redirect: "follow",
            });

            if (response.redirected || response.ok) {
              // Server set cookies and redirected, follow the redirect
              const redirectUrl = response.url || "/entries";
              window.location.href = redirectUrl;
              return;
            }

            // Fallback: try setting session client-side
            const { data, error } = await supabaseBrowser.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error("Set session error:", error);
              router.push("/login?error=auth_failed");
              return;
            }
            
            if (data.session) {
              console.log("Session set from hash tokens:", data.user?.email);
              window.location.href = "/entries";
              return;
            }
          } catch (err) {
            console.error("Set session exception:", err);
            router.push("/login?error=exception");
            return;
          }
        }
      }

      // Try to get existing session
      const { data: { session: existingSession } } = await supabaseBrowser.auth.getSession();
      
      if (existingSession) {
        console.log("Session already exists:", existingSession.user.email);
        // Use full page reload to ensure cookies are sent to server
        window.location.href = "/entries";
        return;
      }

      // Handle code-based flow (PKCE)
      if (code) {
        try {
          const { data, error } = await supabaseBrowser.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Exchange error:", error);
            router.push("/login?error=auth_failed");
            return;
          }
          if (data.session) {
            console.log("Session created from code:", data.user?.email);
            // Use full page reload to ensure cookies are sent to server
            window.location.href = "/entries";
            return;
          }
        } catch (err) {
          console.error("Auth callback error:", err);
          router.push("/login?error=exception");
          return;
        }
      }

      // If we get here, no code and no session
      console.error("No auth code found in URL and no existing session");
      console.error("Please check Supabase redirect URL configuration");
      router.push("/login?error=no_code");
    };

    handleAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <p className="text-sm text-slate-400">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

