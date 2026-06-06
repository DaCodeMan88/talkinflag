import { createServerClient } from "@/lib/supabase";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface StatsBarProps {
  episodeCount?: number;
}

export async function StatsBar({ episodeCount }: StatsBarProps) {
  const episodeLabel = episodeCount ? `${episodeCount}+` : "39+";

  let memberCount = 0;
  let countryCount = 0;
  try {
    const supabase = createServerClient();
    const [playersRes, coachesRes, countriesRes] = await Promise.all([
      supabase.from("players").select("id", { count: "exact", head: true }),
      supabase.from("coaches").select("id", { count: "exact", head: true }),
      supabase.from("players").select("country").not("country", "is", null),
    ]);
    memberCount = (playersRes.count ?? 0) + (coachesRes.count ?? 0);
    const uniqueCountries = new Set(
      (countriesRes.data ?? []).map((r) => r.country).filter(Boolean)
    );
    countryCount = uniqueCountries.size;
  } catch { /* use fallback */ }

  const stats = [
    { value: episodeLabel,                                  label: "Episodes" },
    { value: memberCount > 0 ? `${memberCount}+` : "75+",  label: "Members" },
    { value: countryCount > 1 ? `${countryCount}` : "10+", label: "Countries" },
    { value: "#1",                                          label: "Flag Football Podcast" },
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
