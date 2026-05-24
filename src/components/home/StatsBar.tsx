import { ScrollReveal } from "@/components/ui/ScrollReveal";

const stats = [
  { value: "39+", label: "Episodes" },
  { value: "25+", label: "Countries Represented" },
  { value: "2", label: "Italian National Team Hosts" },
  { value: "#1", label: "Flag Football Podcast" },
];

export function StatsBar() {
  return (
    <section className="bg-brand-yellow py-6" aria-label="Podcast statistics">
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
