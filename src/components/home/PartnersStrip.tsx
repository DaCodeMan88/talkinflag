import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Marquee } from "@/components/ui/Marquee";
import { getLivePartners } from "@/lib/partners";

// Partners are managed at /admin/partners (table `partners`, migration 028).
export async function PartnersStrip() {
  const partners = await getLivePartners();
  if (partners.length === 0) return null;

  return (
    <section className="bg-brand-black border-t border-brand-white/5 py-16 px-6" aria-label="Partners">
      <div className="max-w-5xl mx-auto text-center">
        <ScrollReveal direction="up">
          <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-6">
            Our Partners
          </p>
          <Marquee durationSeconds={24}>
            {partners.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display uppercase tracking-[0.2em] text-lg text-brand-white/70 hover:text-brand-yellow transition-colors whitespace-nowrap"
              >
                {p.name}
              </a>
            ))}
          </Marquee>
          <p className="mt-6 text-brand-white/30 text-xs max-w-md mx-auto">
            Proud to partner with organizations growing flag football worldwide.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
