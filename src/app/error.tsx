"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error in production for observability
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-6 text-center">
      {/* Yellow outline number */}
      <p
        className="font-display text-[clamp(5rem,18vw,14rem)] leading-none text-brand-yellow select-none"
        aria-hidden="true"
        style={{ WebkitTextStroke: "2px #FDDD58", color: "transparent" }}
      >
        500
      </p>

      <h1 className="font-display text-3xl md:text-4xl uppercase text-brand-white mt-4 leading-tight">
        Something Went Wrong
      </h1>
      <p className="mt-4 text-brand-white/60 max-w-sm leading-relaxed">
        We hit an unexpected error. The Talkin Flag team has been notified.
        Try again or head back to the homepage.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mt-10">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center border-2 border-brand-yellow text-brand-yellow font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-brand-yellow hover:text-brand-black transition-colors"
        >
          Back to Home
        </Link>
      </div>

      {/* Quick links */}
      <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {[
          { label: "Podcast", href: "/podcast" },
          { label: "Players", href: "/players" },
          { label: "Events", href: "/events" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-brand-white/40 hover:text-brand-yellow font-display text-xs uppercase tracking-widest transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
