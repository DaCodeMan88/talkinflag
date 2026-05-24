// Latest Talkin Flag episode video ID — update as new episodes drop
const FEATURED_VIDEO_ID = "y3O9mtBkpD8";

const PLATFORMS = [
  {
    name: "YouTube",
    href: "https://youtube.com/@thetalkinballsnetwork",
    style: "bg-[#FF0000] text-white",
  },
  {
    name: "Spotify",
    href: "https://open.spotify.com/search/talkin%20flag",
    style: "bg-[#1DB954] text-black",
  },
  {
    name: "Apple Podcasts",
    href: "https://podcasts.apple.com/search?term=talkin%20flag",
    style: "bg-[#872EC4] text-white",
  },
  {
    name: "Amazon Music",
    href: "https://music.amazon.com/search/talkin+flag",
    style: "bg-[#00A8E1] text-white",
  },
];

export function SubscribePanel() {
  return (
    <section className="relative bg-brand-black pb-24 px-6">
      {/* Seamless continuation — no abrupt edge since the hero already fades to black */}

      <div className="max-w-3xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-10">
          <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-3">
            Watch & Listen
          </p>
          <h2 className="font-display text-4xl md:text-5xl uppercase text-brand-white leading-none">
            The Show
          </h2>
        </div>

        {/* YouTube embed */}
        <div className="relative w-full aspect-video bg-[#0a0a0a] overflow-hidden border border-brand-white/5">
          <iframe
            src={`https://www.youtube.com/embed/${FEATURED_VIDEO_ID}?rel=0&modestbranding=1&color=white`}
            title="Talkin Flag Podcast — Latest Episode"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 w-full h-full"
          />
        </div>

        {/* View all episodes link */}
        <div className="text-center mt-5 mb-14">
          <a
            href="/episodes"
            className="text-brand-white/40 font-display text-[10px] uppercase tracking-[0.25em] hover:text-brand-yellow transition-colors"
          >
            Browse All Episodes →
          </a>
        </div>

        {/* Subscribe platform buttons */}
        <div className="text-center">
          <p className="font-display text-[10px] uppercase tracking-[0.35em] text-brand-white/40 mb-6">
            Subscribe free on your platform
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {PLATFORMS.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${p.style} px-5 py-3 font-display uppercase tracking-widest text-[11px] hover:opacity-90 active:opacity-75 transition-opacity`}
              >
                {p.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
