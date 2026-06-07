import Link from "next/link";

const platforms = [
  {
    name: "YouTube",
    handle: "@thetalkinballsnetwork",
    href: "https://www.youtube.com/@thetalkinballsnetwork",
    live: true,
    icon: (
      <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000" />
        <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    name: "Spotify",
    handle: "Talkin Flag",
    href: "https://open.spotify.com/search/Talkin%20Flag",
    live: false,
    icon: (
      <svg viewBox="0 0 24 24" width="36" height="36" fill="#1DB954" aria-hidden="true">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
  },
  {
    name: "Apple Podcasts",
    handle: "Talkin Flag",
    href: "https://podcasts.apple.com/search?term=Talkin%20Flag",
    live: false,
    icon: (
      <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
        <defs>
          <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F452FF" />
            <stop offset="100%" stopColor="#832BC1" />
          </linearGradient>
        </defs>
        <path fill="url(#appleGrad)" d="M12.002 0C5.377 0 0 5.377 0 12.002c0 6.624 5.377 12.001 12.002 12.001 6.624 0 12.001-5.377 12.001-12.001C24.003 5.377 18.626 0 12.002 0zm0 2.547c2.534 0 4.9.989 6.655 2.76a9.418 9.418 0 0 1 2.744 6.68c0 5.207-4.222 9.428-9.399 9.428-5.176 0-9.398-4.221-9.398-9.428 0-5.162 4.178-9.368 9.398-9.44zm-.024 2.044c-1.52.003-2.886.58-3.927 1.621A5.373 5.373 0 0 0 6.43 9.994a5.39 5.39 0 0 0 1.62 3.834 5.388 5.388 0 0 0 3.803 1.59 5.376 5.376 0 0 0 5.399-5.388 5.387 5.387 0 0 0-5.274-5.44zm.017 1.64a3.745 3.745 0 0 1 3.744 3.745 3.746 3.746 0 0 1-3.744 3.745 3.747 3.747 0 0 1-3.745-3.745 3.746 3.746 0 0 1 3.745-3.745zm0 1.563a2.182 2.182 0 0 0-2.182 2.182 2.183 2.183 0 0 0 2.182 2.183 2.183 2.183 0 0 0 2.183-2.183 2.182 2.182 0 0 0-2.183-2.182zm4.988 6.285c.37.02.713.268.831.644.148.463-.1.945-.556 1.082a9.363 9.363 0 0 1-2.784.422 9.363 9.363 0 0 1-5.33-1.657.868.868 0 0 1-.24-1.207.868.868 0 0 1 1.206-.239 7.628 7.628 0 0 0 4.364 1.358c.762 0 1.51-.105 2.222-.343a.863.863 0 0 1 .287-.06z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    handle: "@talkinflagshow",
    href: "https://instagram.com/talkinflagshow",
    live: true,
    icon: (
      <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
        <defs>
          <linearGradient id="instaGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFDC80" />
            <stop offset="25%" stopColor="#FCAF45" />
            <stop offset="50%" stopColor="#F77737" />
            <stop offset="75%" stopColor="#C13584" />
            <stop offset="100%" stopColor="#833AB4" />
          </linearGradient>
        </defs>
        <path fill="url(#instaGrad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
];

export function ListenOn() {
  return (
    <section className="bg-[#0a0a0a] border-t border-b border-brand-white/5 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-brand-yellow mb-3">
            Listen &amp; Subscribe
          </p>
          <h2 className="font-display text-3xl md:text-4xl uppercase text-brand-white">
            Watch &amp; Follow Talkin Flag
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {platforms.map((platform) => (
            <Link
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center gap-3 border border-white/20 overflow-hidden p-6 transition-all duration-300 hover:border-brand-yellow/50"
            >
              {/* Blue texture base */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url('/blue-bg.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              {/* Dark overlay — reduced so blue is vibrant, lifts further on hover */}
              <div className="absolute inset-0 bg-[#06091a]/[0.48] group-hover:bg-[#06091a]/[0.32] transition-colors duration-300" />

              {/* Content */}
              <div className="relative z-10">
                {platform.icon}
              </div>
              <div className="relative z-10 text-center">
                <p className="font-display text-sm uppercase tracking-widest text-white group-hover:text-brand-yellow transition-colors">
                  {platform.name}
                </p>
                <p className="text-white/60 text-xs mt-1 group-hover:text-white/80 transition-colors">
                  {platform.handle}
                </p>
              </div>
              {!platform.live && (
                <span className="relative z-10 text-white/50 text-xs uppercase tracking-widest border border-white/20 px-2 py-0.5">
                  Coming Soon
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
