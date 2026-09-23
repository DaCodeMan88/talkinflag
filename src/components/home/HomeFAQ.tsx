import Link from "next/link";
import { Accordion, type AccordionItem } from "@/components/ui/Accordion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

// DRAFT copy for Ambra's approval (2026-09-22). Every answer restates a claim
// the site already makes elsewhere (join page, how-rankings-work, homepage
// metadata) — nothing new is promised here.
const linkClass = "text-brand-yellow hover:underline";

const FAQ: AccordionItem[] = [
  {
    question: "Is Talkin Flag free?",
    answer: (
      <>
        Yes — free, always. <Link href="/join" className={linkClass}>Create your player profile</Link> in a few minutes.
      </>
    ),
  },
  {
    question: "Who sees my player profile?",
    answer:
      "Your profile lives in the global flag football database, visible to college coaches, scouts, and national team selectors worldwide.",
  },
  {
    question: "How are players ranked?",
    answer: (
      <>
        The TF Rank is a community-weighted performance rating built on Coaches, Experts, and Hosts poll data.{" "}
        <Link href="/how-rankings-work" className={linkClass}>See exactly how rankings work →</Link>
      </>
    ),
  },
  {
    question: "Who hosts the podcast?",
    answer: (
      <>
        Ambra &amp; Tika Marcucci of the Italian National Team, talking with elite athletes, coaches, and founders building the
        future of flag football. <Link href="/podcast" className={linkClass}>Browse every episode →</Link>
      </>
    ),
  },
  {
    question: "Where can I find flag football events?",
    answer: (
      <>
        Check the <Link href="/events" className={linkClass}>events calendar</Link> or{" "}
        <Link href="/find-a-league" className={linkClass}>find a league</Link> near you.
      </>
    ),
  },
];

export function HomeFAQ() {
  return (
    <section className="bg-brand-black border-t border-brand-white/5 py-20 px-6" aria-labelledby="home-faq-heading">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal direction="up">
          <p className="font-display text-brand-yellow text-xs uppercase tracking-[0.3em] mb-3">Questions</p>
          <h2 id="home-faq-heading" className="font-display text-4xl md:text-6xl uppercase text-brand-white mb-10">
            FAQ
          </h2>
          <Accordion items={FAQ} />
        </ScrollReveal>
      </div>
    </section>
  );
}
