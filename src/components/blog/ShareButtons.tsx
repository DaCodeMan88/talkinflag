"use client";
import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-3">
      <span className="text-brand-white/30 font-display text-xs uppercase tracking-widest">Share</span>
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 border border-brand-white/20 text-brand-white/60 font-display text-xs uppercase tracking-widest px-3 py-1.5 hover:border-brand-white/40 hover:text-brand-white transition-colors"
        aria-label="Share on X"
      >
        <svg width="10" height="10" viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true">
          <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
        </svg>
        Share on X
      </a>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 border border-brand-white/20 text-brand-white/60 font-display text-xs uppercase tracking-widest px-3 py-1.5 hover:border-brand-white/40 hover:text-brand-white transition-colors"
        aria-label="Copy link to clipboard"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
