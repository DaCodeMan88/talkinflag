"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveRejectButtons({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function act(action: "approve" | "reject") {
    setPending(true);
    await fetch("/api/scouts/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_id: applicationId, action }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 pt-2 border-t border-brand-white/5">
      <button
        onClick={() => act("approve")}
        disabled={pending}
        className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => act("reject")}
        disabled={pending}
        className="border border-red-500/40 text-red-400 font-display uppercase tracking-widest text-xs py-2 px-5 hover:border-red-500/70 transition-colors disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
