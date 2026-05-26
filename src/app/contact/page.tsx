import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "./ContactForm";

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

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <span className="font-display text-xs uppercase tracking-widest text-brand-yellow">
            Get in Touch
          </span>
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white mt-2 leading-none">
            Contact
          </h1>
          <div className="mt-5 flex items-start gap-5">
            <div className="w-8 h-px bg-brand-yellow mt-3 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-brand-white/55 leading-relaxed">
                Reach out about podcast features, player submissions, partnerships, or press.
                We read everything and respond personally.
              </p>
              <p className="mt-3 text-brand-white/40 text-sm">
                Or email us directly:{" "}
                <a
                  href="mailto:talkinflagshow@gmail.com"
                  className="text-brand-yellow hover:underline"
                >
                  talkinflagshow@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
