import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Reach out about podcast features, player submissions, partnerships, or press.",
  path: "/contact",
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://talkinflag.com" },
    { "@type": "ListItem", "position": 2, "name": "Contact", "item": "https://talkinflag.com/contact" },
  ],
};

const SUBJECTS = [
  "Podcast Feature",
  "Player Submission",
  "Partnership / Sponsorship",
  "Press",
  "Other",
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
          Get in Touch
        </span>
        <h1 className="font-display text-4xl md:text-6xl uppercase text-brand-white mt-2 leading-tight">
          Contact
        </h1>
        <p className="text-brand-white/60 mt-4 mb-12">
          Reach out about podcast features, player submissions, partnerships, or press.
        </p>

        <form
          action="mailto:daniel@dubsportsentertainment.com"
          method="post"
          encType="text/plain"
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block font-display text-xs uppercase tracking-widest text-brand-white/60 mb-2">
                Name <span className="text-brand-yellow" aria-hidden="true">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full bg-[#111111] border border-brand-white/15 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/30"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block font-display text-xs uppercase tracking-widest text-brand-white/60 mb-2">
                Email <span className="text-brand-yellow" aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-[#111111] border border-brand-white/15 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/30"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block font-display text-xs uppercase tracking-widest text-brand-white/60 mb-2">
              Subject
            </label>
            <div className="relative">
              <select
                id="subject"
                name="subject"
                className="appearance-none w-full bg-[#111111] border border-brand-white/15 text-brand-white/70 px-4 pr-10 py-3 text-sm focus:border-brand-yellow focus:outline-none cursor-pointer"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-white/40">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true">
                  <path d="M0 0l5 6 5-6z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block font-display text-xs uppercase tracking-widest text-brand-white/60 mb-2">
              Message <span className="text-brand-yellow" aria-hidden="true">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              className="w-full bg-[#111111] border border-brand-white/15 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/30 resize-none"
              placeholder="Tell us what's on your mind…"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors"
          >
            Send Message →
          </button>
        </form>
      </div>
    </div>
  );
}
