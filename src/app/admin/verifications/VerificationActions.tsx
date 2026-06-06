"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  verificationId: string;
  playerId: string;
};

export default function VerificationActions({ verificationId, playerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);
  const [done, setDone] = useState(false);

  async function handleAction(status: "approved" | "rejected") {
    setLoading(status);
    try {
      await fetch(`/api/admin/verifications/${verificationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, playerId }),
        headers: { "Content-Type": "application/json" },
      });
      setDone(true);
      setTimeout(() => router.refresh(), 600);
    } catch {
      setLoading(null);
    }
  }

  if (done) {
    return <span className="text-[#FDDD58] text-sm font-medium">✓ Done</span>;
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction("approved")}
        disabled={loading !== null}
        className="px-3 py-1.5 text-sm font-medium rounded bg-[#FDDD58] text-black hover:bg-yellow-300 disabled:opacity-50 transition-colors"
      >
        {loading === "approved" ? "…" : "Approve"}
      </button>
      <button
        onClick={() => handleAction("rejected")}
        disabled={loading !== null}
        className="px-3 py-1.5 text-sm font-medium rounded bg-white/10 text-red-400 hover:bg-red-900/40 disabled:opacity-50 transition-colors"
      >
        {loading === "rejected" ? "…" : "Reject"}
      </button>
    </div>
  );
}
