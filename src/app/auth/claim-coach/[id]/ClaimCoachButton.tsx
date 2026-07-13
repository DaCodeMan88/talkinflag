"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClaimCoachButton({
  coachId,
  coachName,
}: {
  coachId: string;
  coachName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClaim() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/login?claimCoach=${coachId}`);
      return;
    }

    const res = await fetch(`/api/coaches/${coachId}/claim`, { method: "POST" });
    const json = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Something went wrong. Please try again.");
    } else {
      router.push(`/dashboard?claimedCoach=${coachId}`);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-4 py-3">
          {error}
        </div>
      )}
      <button
        onClick={handleClaim}
        disabled={loading}
        className="w-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-3 px-6 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="animate-spin border-2 border-brand-black border-t-transparent rounded-full w-4 h-4" />
        )}
        Yes, Claim {coachName}&apos;s Profile
      </button>
    </div>
  );
}
