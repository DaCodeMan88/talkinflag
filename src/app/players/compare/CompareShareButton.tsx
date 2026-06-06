"use client";

import { useState } from "react";

export function CompareShareButton() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className={`font-display uppercase tracking-widest text-xs px-5 py-2.5 border transition-colors ${
        copied
          ? "border-[#FDDD58] text-[#FDDD58] bg-[#FDDD58]/10"
          : "border-white/20 text-white/50 hover:border-[#FDDD58]/40 hover:text-[#FDDD58]"
      }`}
    >
      {copied ? "✓ Link Copied!" : "Share Comparison →"}
    </button>
  );
}
