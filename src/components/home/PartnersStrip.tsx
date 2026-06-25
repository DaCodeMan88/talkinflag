import { ScrollReveal } from "@/components/ui/ScrollReveal";

// Confirmed partners (2026-06-25).
const PARTNERS: { name: string; url: string }[] = [
  { name: "Flag Football Finder", url: "https://flagfootballfinder.com" },
  { name: "Athleads", url: "https://athleads.com" },
];

export function PartnersStrip() {
  return (
    <section className="bg-brand-black border-t border-brand-white/5 py-16 px-6" aria-label="Partners">
      <div className="max-w-5xl mx-auto text-center">
        <ScrollReveal direction="up">
          <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-6">
            Our Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {PARTNERS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display uppercase tracking-[0.2em] text-lg text-brand-white/70 hover:text-brand-yellow transition-colors"
              >
                {p.name}
              </a>
            ))}
          </div>
          <p className="mt-6 text-brand-white/30 text-xs max-w-md mx-auto">
            Proud to partner with organizations growing flag football worldwide.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
