import { createServerClient } from "@/lib/supabase";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface StatsBarProps {
  episodeCount?: number;
}

export async function StatsBar({ episodeCount }: StatsBarProps) {
  const episodeLabel = episodeCount ? `${episodeCount}+` : "39+";

  // Live player count
  let playerCount = 75;
  try {
    const supabase = createServerClient();
    const { count } = await supabase
      .from("players")
      .select("id", { count: "exact", head: true });
    if (count && count > 0) playerCount = count;
  } catch { /* use fallback */ }

  const stats = [
    { value: episodeLabel,              label: "Episodes" },
    { value: `${playerCount}+`,         label: "Player Profiles" },
    { value: "14",                       label: "States Represented" },
    { value: "#1",                       label: "Flag Football Podcast" },
  ];

  return (
    <section className="bg-brand-yellow py-6" aria-label="Platform statistics">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} direction="up" delay={i * 0.1}>
              <p className="font-display text-4xl md:text-5xl text-brand-black">{stat.value}</p>
              <p className="font-display text-xs uppercase tracking-widest text-brand-black/60 mt-1">{stat.label}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
