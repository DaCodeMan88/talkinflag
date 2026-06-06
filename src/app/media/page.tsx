import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Media & Gallery | Talkin Flag",
  description:
    "Photos, highlights, and behind-the-scenes moments from Ambra & Tika Marcucci and the Talkin Flag world.",
  path: "/media",
});

// ─── Gallery images ───────────────────────────────────────────────────────────
// To add images: drop files into /public/gallery/ and add an entry here.
const GALLERY_IMAGES: { src: string; alt: string; wide?: boolean; caption?: string }[] = [
  { src: "/hosts-hero.jpg", alt: "Ambra & Tika Marcucci — Talkin Flag hosts", wide: true, caption: "Ambra & Tika Marcucci · Talkin Flag" },
  { src: "/ambra.jpg", alt: "Ambra Marcucci", caption: "Ambra Marcucci" },
  { src: "/tika.jpg", alt: "Tika Marcucci", caption: "Tika Marcucci" },
  { src: "/hosts-wide.jpg", alt: "Ambra & Tika wide shot", wide: true, caption: "Behind the mic" },
  // Add new images: { src: "/gallery/your-image.jpg", alt: "...", caption: "..." },
];

// ─── Instagram posts — 3×3 grid ──────────────────────────────────────────────
// Row layout: [popular, popular, recent] × 3
const INSTAGRAM_POSTS = [
  // 4 most popular (by engagement)
  { shortcode: "DKULB7cNxpR", label: "Most popular · 20.4K likes" },
  { shortcode: "DHHVMyKN9Qw", label: "Popular · 8.5K likes" },
  { shortcode: "DZIWIHgt8bq", label: "Fiesta Bowl Flag Football Classic" },
  { shortcode: "DY2T9iytnox", label: "Flag football is already here" },
  // 5 most recent
  { shortcode: "DZNRMgSDZOs", label: "S3 Episode 20 · EFAF" },
  { shortcode: "DZFuHE0jdPw", label: "Brazil Nation Spotlight" },
  { shortcode: "DZAmA5TDc5e", label: "Athletes & coaches" },
  { shortcode: "DY7WHrhDdm5", label: "S3 Episode 19 · Fiesta Bowl" },
  { shortcode: "DYztBlcDcBL", label: "Jamaica Nation Spotlight" },
];

const INSTAGRAM_HANDLE = "talkinflagshow";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

export default function MediaPage() {
  return (
    <>
      {/* Instagram embed script — loaded once, processes all blockquotes */}
      <Script
        src="//www.instagram.com/embed.js"
        strategy="lazyOnload"
      />

      <div className="bg-brand-black min-h-screen">
        {/* Header */}
        <div className="bg-[#FDDD58] px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-black/50 mb-3">
              Talkin Flag
            </p>
            <h1 className="font-display text-5xl md:text-7xl uppercase text-black leading-none">
              Media
            </h1>
            <p className="text-black/60 mt-4 text-base max-w-xl">
              Photos and moments from Ambra, Tika, and the world of flag football.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-16 space-y-20">

          {/* Photo gallery */}
          <section>
            <h2 className="font-display text-xs uppercase tracking-[0.25em] text-white/30 mb-8">
              Gallery
            </h2>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {GALLERY_IMAGES.map((img, i) => (
                <div
                  key={i}
                  className="break-inside-avoid group relative overflow-hidden bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={800}
                    height={img.wide ? 450 : 600}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {img.caption && (
                    <div className="px-4 py-3 border-t border-white/5">
                      <p className="text-white/40 text-xs font-display uppercase tracking-widest">
                        {img.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Instagram 3×3 grid */}
          <section>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="font-display text-xs uppercase tracking-[0.25em] text-[#FDDD58] mb-2">
                  Follow Along
                </p>
                <h2 className="font-display text-4xl md:text-5xl uppercase text-white leading-none">
                  @{INSTAGRAM_HANDLE}
                </h2>
              </div>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 hidden md:flex items-center gap-2 border border-[#FDDD58]/40 text-[#FDDD58] font-display uppercase tracking-widest px-5 py-2.5 text-xs hover:bg-[#FDDD58] hover:text-black transition-colors"
              >
                <InstagramIcon />
                Follow
              </a>
            </div>

            {/* 3×3 grid of embedded posts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INSTAGRAM_POSTS.map(({ shortcode }) => (
                <div
                  key={shortcode}
                  className="bg-[#0d0d0d] border border-white/10 overflow-hidden flex justify-center"
                >
                  {/* Instagram official embed blockquote */}
                  {/* eslint-disable-next-line react/no-danger */}
                  <blockquote
                    className="instagram-media w-full !min-w-0 !max-w-full"
                    data-instgrm-permalink={`https://www.instagram.com/reel/${shortcode}/`}
                    data-instgrm-version="14"
                    style={{
                      background: "#0d0d0d",
                      border: "none",
                      borderRadius: 0,
                      margin: 0,
                      padding: 0,
                      width: "100%",
                    }}
                  >
                    {/* Fallback while embed loads */}
                    <a
                      href={`https://www.instagram.com/reel/${shortcode}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-3 p-8 text-center min-h-[280px] hover:bg-white/5 transition-colors group"
                    >
                      <InstagramIcon className="w-8 h-8 text-[#FDDD58]" />
                      <span className="text-white/40 font-display text-xs uppercase tracking-widest group-hover:text-white/70 transition-colors">
                        View on Instagram →
                      </span>
                    </a>
                  </blockquote>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#FDDD58] font-display uppercase tracking-widest text-xs hover:underline"
              >
                <InstagramIcon />
                See all posts @{INSTAGRAM_HANDLE}
              </a>
            </div>
          </section>

          {/* Submit CTA */}
          <section className="bg-[#0d0d0d] border border-white/10 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-display text-sm uppercase text-white mb-1">
                Have a photo or highlight to share?
              </p>
              <p className="text-white/40 text-sm">
                Tag us on Instagram or reach out directly.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#FDDD58]/40 text-[#FDDD58] font-display uppercase tracking-widest px-5 py-2.5 text-xs hover:bg-[#FDDD58] hover:text-black transition-colors"
              >
                Tag on IG →
              </a>
              <Link
                href="/contact"
                className="border border-white/15 text-white/50 font-display uppercase tracking-widest px-5 py-2.5 text-xs hover:border-white/30 hover:text-white transition-colors"
              >
                Contact →
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
