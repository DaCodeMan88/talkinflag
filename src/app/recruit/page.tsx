import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Recruit Players | Talkin Flag — Find Elite Flag Football Talent",
  description:
    "Browse the Talkin Flag global player database. Connect with verified flag football athletes across all levels — high school, college, national, and pro.",
  path: "/recruit",
});

export default function RecruitPage() {
  return (
    <div className="min-h-screen bg-brand-black">
      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-yellow/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <p className="font-display text-brand-yellow text-xs uppercase tracking-[0.3em] mb-6">
            For Coaches &amp; Scouts
          </p>
          <h1 className="font-display text-6xl md:text-8xl uppercase text-brand-white leading-none mb-6">
            Find Elite<br />
            <span className="text-brand-yellow">Flag Football</span><br />
            Talent
          </h1>
          <p className="text-brand-white/60 text-lg max-w-xl mb-10 leading-relaxed">
            The Talkin Flag player database connects coaches and scouts with verified
            athletes from around the world — complete with highlight videos, stats,
            and contact information.
          </p>

          <Link
            href="/players"
            className="inline-flex items-center gap-3 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors"
          >
            Browse Player Database
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-brand-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl uppercase text-brand-white mb-12 text-center">
            What You Get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Global Database",
                body: "Athletes from the US, Europe, Latin America, and beyond. Flag football is worldwide — so is our database.",
              },
              {
                title: "Verified Profiles",
                body: "Every player is manually reviewed before appearing. No bots, no fake profiles — just real talent.",
              },
              {
                title: "Highlight Videos",
                body: "Watch players in action before reaching out. Every profile links directly to game film and highlight reels.",
              },
            ].map((feat) => (
              <div key={feat.title} className="border border-brand-white/10 bg-[#111111] p-6">
                <div className="w-8 h-1 bg-brand-yellow mb-4" />
                <h3 className="font-display text-xl uppercase text-brand-white mb-3">{feat.title}</h3>
                <p className="text-brand-white/60 text-sm leading-relaxed">{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-14 px-4 bg-brand-yellow">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "Global", label: "Player Coverage" },
            { value: "48hr", label: "Review Turnaround" },
            { value: "Free", label: "Always Free to Browse" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-4xl md:text-5xl uppercase text-brand-black leading-none">{stat.value}</p>
              <p className="text-brand-black/60 text-xs uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Player CTA */}
      <section className="py-24 px-4 border-t border-brand-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-display text-brand-yellow text-xs uppercase tracking-[0.3em] mb-4">
            Are You a Player?
          </p>
          <h2 className="font-display text-4xl md:text-5xl uppercase text-brand-white mb-4">
            Get Discovered
          </h2>
          <p className="text-brand-white/60 mb-8 max-w-lg mx-auto leading-relaxed">
            Submit your player profile and get in front of college coaches, national
            team selectors, and scouts worldwide. It's completely free.
          </p>
          <Link
            href="/players/submit"
            className="inline-flex items-center gap-3 border-2 border-brand-yellow text-brand-yellow font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-brand-yellow hover:text-brand-black transition-colors"
          >
            Submit Your Profile
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
