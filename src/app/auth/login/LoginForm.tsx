"use client";

import { useState, useSyncExternalStore, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { isInAppBrowser } from "@/lib/in-app-browser";

export default function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; claim?: string; claimCoach?: string }>;
}) {
  const { next = "/dashboard", claim, claimCoach } = use(searchParams);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server renders false (no banner); client snapshot is computed after
  // hydration — no hydration mismatch, no setState-in-effect.
  const inAppBrowser = useSyncExternalStore(
    subscribeNoop,
    () => isInAppBrowser(navigator.userAgent),
    () => false
  );

  const postLoginPath = claimCoach
    ? `/auth/claim-coach/${claimCoach}`
    : claim
      ? `/auth/claim/${claim}`
      : next;

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(postLoginPath)}`
      : `/auth/callback`;

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setGoogleLoading(false);
      setError(error.message);
    }
  }

  if (sent) {
    return (
      <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="font-display text-xl uppercase text-brand-yellow mb-2">
          Check Your Email
        </h2>
        <p className="text-brand-white/60 text-sm leading-relaxed">
          We sent a magic link to <span className="text-brand-white">{email}</span>.
          Click the link to sign in — no password needed.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="mt-6 text-brand-white/30 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {inAppBrowser && (
        <div
          role="status"
          className="bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-xs px-4 py-3 leading-relaxed"
        >
          <p className="font-display uppercase tracking-widest mb-1">Heads up</p>
          <p className="text-brand-yellow/80">
            You&apos;re inside an app&apos;s built-in browser (Instagram, WhatsApp, etc.), where
            Google sign-in is blocked by Google. Use the <strong>email magic link</strong>{" "}
            below &mdash; or tap the &hellip; menu and choose &ldquo;Open in Browser&rdquo; first.
          </p>
        </div>
      )}

      {/* Google OAuth */}
      <button
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 bg-brand-white text-brand-black font-display uppercase tracking-widest text-sm py-3 px-6 hover:bg-brand-yellow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <span className="animate-spin border-2 border-brand-black border-t-transparent rounded-full w-4 h-4" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-brand-white/10" />
        <span className="text-brand-white/25 text-xs font-display uppercase tracking-widest">or</span>
        <div className="flex-1 border-t border-brand-white/10" />
      </div>

      {/* Email magic link */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-3 px-6 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="animate-spin border-2 border-brand-black border-t-transparent rounded-full w-4 h-4" />
          )}
          Send Magic Link
        </button>
      </form>

      <p className="text-brand-white/20 text-xs text-center leading-relaxed">
        By signing in you agree to our terms. Your account is free.
      </p>
    </div>
  );
}

// UA never changes during a page's lifetime — nothing to subscribe to.
function subscribeNoop() {
  return () => {};
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
