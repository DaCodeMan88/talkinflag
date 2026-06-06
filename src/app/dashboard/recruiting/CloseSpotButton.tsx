"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CloseSpotButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    if (!confirm("Close this roster spot?")) return;
    setLoading(true);
    await fetch("/api/coaches/spots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleClose}
      disabled={loading}
      className="text-xs text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-400 px-2 py-1 rounded transition-colors disabled:opacity-50"
    >
      {loading ? "Closing…" : "Close"}
    </button>
  );
}
