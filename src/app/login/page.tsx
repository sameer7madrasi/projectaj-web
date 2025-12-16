// app/login/page.tsx
"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMagicLink = async () => {
    setStatus(null);
    setError(null);

    const e = email.trim().toLowerCase();
    if (!e) return setError("Enter your email.");

    // Invite-only check
    const allowRes = await fetch(`/api/is-allowed?email=${encodeURIComponent(e)}`);
    if (!allowRes.ok) return setError("Private beta check failed. Try again.");

    const { allowed } = await allowRes.json();
    if (!allowed) return setError("ProjectAJ is currently private beta. You're not on the allowlist yet.");

    const { error: signInError } = await supabaseBrowser.auth.signInWithOtp({
      email: e,
      options: {
        // must match Supabase redirect allowlist
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });

    if (signInError) return setError(signInError.message);

    setStatus("Magic link sent! Check your email.");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-3xl font-bold">Log in</h1>
        <p className="text-sm text-slate-400">
          Private beta. We'll email you a magic link to sign in.
        </p>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg px-3 py-2 bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:ring focus:ring-sky-500/40"
        />

        <button
          onClick={sendMagicLink}
          className="rounded-lg px-4 py-2 bg-sky-500 text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          Send magic link
        </button>

        {status && <p className="text-sm text-emerald-400">{status}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </main>
  );
}

