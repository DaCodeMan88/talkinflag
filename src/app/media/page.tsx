import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Media & Gallery | Talkin Flag",
  description:
    "Photos, highlights, and behind-the-scenes moments from Ambra & Tika Marcucci and the Talkin Flag world.",
  path: "/media",
});

// ─── Gallery images ──────────────────────────────────────────────────────────
// To add images: drop files into /public/gallery/ and add an entry here.
// src: path relative to /public  |  alt: descriptive text  |  span: grid size hint
const GALLERY_IMAGES: {
  src: string;
  alt: string;
  wide?: boolean; // spans 2 columns on larger grids
  tall?: boolean; // spans 2 rows
  caption?: string;
}[] = [
  // Existing host photos
  {
    src: "/hosts-hero.jpg",
    alt: "Ambra & Tika Marcucci — Talkin Flag hosts",
    wide: true,
    caption: "Ambra & Tika Marcucci · Talkin Flag",
  },
  {
    src: "/ambra.jpg",
    alt: "Ambra Marcucci",
    caption: "Ambra Marcucci",
  },
  {
    src: "/tika.jpg",
    alt: "Tika Marcucci",
    caption: "Tika Marcucci",
  },
  {
    src: "/hosts-wide.jpg",
    alt: "Ambra & Tika wide shot",
    wide: true,
    caption: "Behind the mic",
  },
  // Add new images below — drop files into /public/gallery/
  // { src: "/gallery/your-image.jpg", alt: "Description", caption: "Caption text" },
];

const INSTAGRAM_HANDLE = "talkinflagshow";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

export default function MediaPage() {
  return (
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

          {/* Responsive masonry-style grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {GALLERY_IMAGES.map((img, i) => (
              <div
                key={i}
                className="break-inside-avoid group relative overflow-hidden bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors"
              >
                <div className="relative w-full">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={800}
                    height={img.wide ? 450 : 600}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
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

        {/* Instagram section */}
        <section className="border-t border-white/10 pt-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.25em] text-[#FDDD58] mb-2">
                Follow Along
              </p>
              <h2 className="font-display text-4xl md:text-5xl uppercase text-white leading-none">
                Instagram
              </h2>
              <p className="text-white/40 mt-2 text-sm">
                @{INSTAGRAM_HANDLE} · The latest from Ambra & Tika
              </p>
            </div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-3 bg-[#FDDD58] text-black font-display uppercase tracking-widest px-6 py-3 text-sm hover:bg-[#FDDD58]/80 transition-colors"
            >
              <InstagramIcon />
              Follow @{INSTAGRAM_HANDLE}
            </a>
          </div>

          {/* Instagram embed placeholder */}
          {/*
            To add a live Instagram feed, use one of these services:
            1. Behold.so (~$19/mo) — paste their embed script/widget here
            2. Elfsight — paste their widget code here
            3. Instagram Graph API — requires Meta Business verification

            Replace the placeholder below with the embed code once set up.
          */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <a
                key={i}
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group aspect-square bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors flex items-center justify-center overflow-hidden"
              >
                <div className="text-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <InstagramIcon className="w-5 h-5 text-[#FDDD58] mx-auto" />
                </div>
                {/* Placeholder gradient */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>

          <p className="text-white/20 text-xs text-center mt-4 font-display uppercase tracking-widest">
            Visit{" "}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FDDD58]/60 hover:text-[#FDDD58] transition-colors"
            >
              @{INSTAGRAM_HANDLE}
            </a>{" "}
            on Instagram to see the latest
          </p>
        </section>

        {/* Submit / contact CTA */}
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
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
