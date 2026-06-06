import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Community | Talkin Flag",
  description: "Join the Talkin Flag community on Discord — players, coaches, scouts, and fans building the future of flag football.",
  path: "/community",
});

const DISCORD_INVITE = "https://discord.gg/talkinflag";

const CHANNELS = [
  { name: "# general", desc: "Introductions, hot takes, everything flag" },
  { name: "# recruiting", desc: "Players looking for teams, coaches looking for athletes" },
  { name: "# events", desc: "Combines, tournaments, showcases near you" },
  { name: "# international", desc: "World Championships, Olympic talk, national teams" },
  { name: "# film-room", desc: "Post clips, get feedback, break down tape" },
];

const RULES = [
  "Respect every player, coach, and fan regardless of level.",
  "No spam, self-promo without context, or recruiting DMs without consent.",
  "Keep recruiting convo in #recruiting — not general.",
  "Coaches: be transparent about your program and intentions.",
  "English preferred in main channels; other languages welcome in dedicated threads.",
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="border-l-4 border-brand-yellow pl-6 mb-14">
          <p className="text-brand-yellow text-xs font-display uppercase tracking-[0.3em] mb-2">
            Community
          </p>
          <h1 className="font-display text-6xl md:text-7xl uppercase text-brand-white leading-none">
            Join the<br />Conversation
          </h1>
          <p className="text-brand-white/50 mt-5 text-base leading-relaxed max-w-xl">
            Players, coaches, scouts, and fans from around the world — all in one place. Hosted by Ambra & Tika Marcucci.
          </p>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 mt-8 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-4 px-8 hover:bg-brand-yellow/90 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Join on Discord
          </a>
        </div>

        {/* What to expect */}
        <div className="mb-14">
          <h2 className="font-display text-xs uppercase tracking-widest text-brand-white/30 mb-6">What&apos;s Inside</h2>
          <div className="space-y-1">
            {CHANNELS.map((ch) => (
              <div key={ch.name} className="flex items-start gap-4 bg-[#0d0d0d] border border-brand-white/5 px-5 py-4">
                <span className="font-mono text-brand-yellow text-sm flex-shrink-0 w-36">{ch.name}</span>
                <span className="text-brand-white/50 text-sm">{ch.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Community rules */}
        <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 mb-14">
          <h2 className="font-display text-xs uppercase tracking-widest text-brand-white/30 mb-5">Community Rules</h2>
          <ol className="space-y-3">
            {RULES.map((rule, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="font-display text-brand-yellow text-xs w-4 flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span className="text-brand-white/60 text-sm leading-relaxed">{rule}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Bottom CTA */}
        <div className="text-center space-y-4">
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-4 px-8 hover:bg-brand-yellow/90 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Join the Discord
          </a>
          <p className="text-brand-white/20 text-xs">
            500+ active members = we build a custom forum right here on Talkin Flag.
          </p>
        </div>

      </div>
    </div>
  );
}
