import Link from "next/link";

export const metadata = {
  title: "404 — Page Not Found | Talkin Flag",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-6 text-center">
      {/* Big yellow 404 */}
      <p
        className="font-display text-[clamp(6rem,20vw,16rem)] leading-none text-brand-yellow select-none"
        aria-hidden="true"
        style={{ WebkitTextStroke: "3px #FDDD58", color: "transparent" }}
      >
        404
      </p>

      <h1 className="font-display text-3xl md:text-5xl uppercase text-brand-white mt-4 leading-tight">
        Flag Not Found
      </h1>
      <p className="mt-4 text-brand-white/60 max-w-sm leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist. Maybe it got intercepted by a defender.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mt-10">
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors"
        >
          Back to Home
        </Link>
        <Link
          href="/podcast"
          className="inline-flex items-center justify-center border-2 border-brand-yellow text-brand-yellow font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-brand-yellow hover:text-brand-black transition-colors"
        >
          Watch Episodes
        </Link>
      </div>

      {/* Quick links */}
      <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {[
          { label: "Players", href: "/players" },
          { label: "Events", href: "/events" },
          { label: "Blog", href: "/blog" },
          { label: "About", href: "/about" },
          { label: "Recruit", href: "/recruit" },
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
