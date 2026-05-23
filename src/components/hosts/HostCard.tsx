interface Host {
  name: string;
  title: string;
  bio: string;
  flag: string;
  instagram: string;
  image: string;
}

export function HostCard({ host }: { host: Host }) {
  return (
    <div className="bg-[#222222] border border-brand-white/10 hover:border-brand-yellow/40 transition-colors overflow-hidden">
      <div className="relative aspect-square bg-[#111111]">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-yellow/10 to-brand-black">
          <span className="text-8xl" role="img" aria-label="Italian flag">🇮🇹</span>
        </div>
      </div>
      <div className="p-6">
        <p className="text-brand-yellow font-display text-xs uppercase tracking-widest">{host.title}</p>
        <h2 className="font-display text-2xl uppercase text-brand-white mt-1">{host.name}</h2>
        <p className="text-brand-white/60 text-sm mt-3 leading-relaxed">{host.bio}</p>
        <a
          href={`https://instagram.com/${host.instagram.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-brand-yellow text-sm hover:underline"
          aria-label={`${host.name} on Instagram`}
        >
          {host.instagram} ↗
        </a>
      </div>
    </div>
  );
}
