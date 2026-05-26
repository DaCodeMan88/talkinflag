import { TeamsHub } from "@/components/rankings/TeamsHub";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Teams | Talkin Flag — World & College Flag Football",
  description:
    "Flag football team rankings — IFAF world national team standings and NCAA college program directory.",
  path: "/teams",
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",  item: "https://talkinflag.com" },
    { "@type": "ListItem", position: 2, name: "Teams", item: "https://talkinflag.com/teams" },
  ],
};

export default function TeamsPage() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Teams</h1>
          <p className="mt-3 text-brand-white/60">
            IFAF world national team rankings and NCAA college program directory.
          </p>
        </div>
        <TeamsHub />
      </div>
    </div>
  );
}
