import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Find a Flag Football League Near You | Talkin Flag",
  description:
    "Looking for a flag football league? Use NFL FLAG, USA Football, and other tools to find leagues for kids, adults, and elite players near you.",
  path: "/find-a-league",
});

const RESOURCES = [
  {
    name: "NFL FLAG League Finder",
    description: "The largest organized flag football program in the US. Find youth and adult leagues near you — covers most major cities and many smaller communities.",
    href: "https://play.nflflag.com/",
    tag: "Youth & Adult",
    cta: "Find a League →",
  },
  {
    name: "USA Football",
    description: "The national governing body for American football. Provides directories for youth flag programs and development resources for players and coaches.",
    href: "https://usafootball.com",
    tag: "All Levels",
    cta: "Visit USA Football →",
  },
  {
    name: "IFAF — International Federation",
    description: "Looking to compete internationally or find a national team program? IFAF is the global governing body. Find your country's federation here.",
    href: "https://www.americanfootball.sport/",
    tag: "International",
    cta: "Visit IFAF →",
  },
  {
    name: "Pop Warner",
    description: "One of the oldest youth football organizations in the US, with a growing flag football division. Competitive structure with district and regional championships.",
    href: "https://www.popwarner.com",
    tag: "Youth",
    cta: "Visit Pop Warner →",
  },
];

const TIPS = [
  {
    title: "Know your level",
    body: "Recreational leagues prioritize fun over wins. Competitive leagues have tryouts, structured practice, and playoff formats. Be honest with yourself about where you fit.",
  },
  {
    title: "Check your local parks & rec",
    body: "Most cities run flag football through their parks departments. These are often the most affordable options and great for beginners and families.",
  },
  {
    title: "Ask at the YMCA",
    body: "The Y runs leagues in many communities nationwide — especially good for youth players just starting out.",
  },
  {
    title: "Travel team for high-schoolers",
    body: "If you're a high school player who wants elite exposure, look for club and travel teams in your region. These programs compete nationally and get noticed by scouts.",
  },
];

export default function FindALeaguePage() {
  return (
    <div className="bg-brand-black min-h-screen">
      {/* Header */}
      <div className="bg-[#FDDD58] px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-black/50 mb-3">
            Talkin Flag · Resources
          </p>
          <h1 className="font-display text-5xl md:text-7xl uppercase text-black leading-none">
            Find a League
          </h1>
          <p className="text-black/60 mt-4 text-base max-w-xl">
            Whether you're 8 or 48 — recreational, competitive, or national team level —
            there's a flag football league for you. Here's where to look.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">

        {/* Resources grid */}
        <section>
          <h2 className="font-display text-xs uppercase tracking-[0.25em] text-[#FDDD58] mb-6">
            League Finders &amp; Directories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RESOURCES.map((r) => (
              <a
                key={r.name}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors p-6 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-lg uppercase text-white group-hover:text-[#FDDD58] transition-colors leading-tight">
                    {r.name}
                  </p>
                  <span className="shrink-0 bg-[#FDDD58]/10 text-[#FDDD58] font-display text-xs uppercase tracking-widest px-2.5 py-1">
                    {r.tag}
                  </span>
                </div>
                <p className="text-white/50 text-sm leading-relaxed flex-1">{r.description}</p>
                <span className="text-[#FDDD58] font-display text-xs uppercase tracking-widest group-hover:underline">
                  {r.cta}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Tips section */}
        <section>
          <h2 className="font-display text-xs uppercase tracking-[0.25em] text-white/30 mb-6">
            Tips for Finding the Right Fit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIPS.map((t) => (
              <div key={t.title} className="bg-[#0d0d0d] border border-white/10 p-5">
                <p className="font-display text-sm uppercase text-white mb-2">{t.title}</p>
                <p className="text-white/40 text-sm leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Blog CTA */}
        <section className="border-t border-white/10 pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-display text-xs uppercase tracking-widest text-[#FDDD58] mb-2">
              Deep Dive
            </p>
            <p className="font-display text-2xl uppercase text-white leading-tight">
              The Complete League<br />Finding Guide
            </p>
            <p className="text-white/40 text-sm mt-2 max-w-md">
              Youth, high school, adult recreational, elite competitive — a full breakdown of every pathway into organized flag football.
            </p>
          </div>
          <Link
            href="/blog/how-to-find-flag-football-league"
            className="shrink-0 bg-[#FDDD58] text-black font-display uppercase tracking-widest px-6 py-3 text-sm hover:bg-[#FDDD58]/80 transition-colors"
          >
            Read the Guide →
          </Link>
        </section>

        {/* Events CTA */}
        <section className="bg-[#0d0d0d] border border-white/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-display text-sm uppercase text-white mb-1">
              Looking for Tournaments?
            </p>
            <p className="text-white/40 text-sm">
              Browse upcoming flag football events from youth to international level.
            </p>
          </div>
          <Link
            href="/events"
            className="shrink-0 border border-[#FDDD58]/40 text-[#FDDD58] font-display uppercase tracking-widest px-5 py-2.5 text-xs hover:bg-[#FDDD58] hover:text-black transition-colors"
          >
            View Events →
          </Link>
        </section>

      </div>
    </div>
  );
}
