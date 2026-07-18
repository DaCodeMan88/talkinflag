import { hasDisplayableValue } from "@/lib/profile-visibility";

function handleOf(v: string): string {
  return v
    .replace(/^https?:\/\/(www\.)?(instagram\.com|tiktok\.com)\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.8" cy="6.2" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.32 5.56a5.1 5.1 0 0 1-3.05-2.98A5.06 5.06 0 0 1 16 1h-3.4v13.67a2.89 2.89 0 1 1-2.06-2.77V8.42a6.34 6.34 0 1 0 4.52 6.08V8.69a8.44 8.44 0 0 0 4.94 1.58V6.87c-.58 0-1.15-.11-1.68-.31z" />
    </svg>
  );
}

export default function SocialLinks({
  instagram,
  tiktok,
}: {
  instagram?: string | null;
  tiktok?: string | null;
}) {
  const items = [
    hasDisplayableValue(instagram) && {
      label: "Instagram",
      handle: handleOf(instagram!),
      href: `https://instagram.com/${handleOf(instagram!)}`,
      icon: <InstagramIcon />,
    },
    hasDisplayableValue(tiktok) && {
      label: "TikTok",
      handle: handleOf(tiktok!),
      href: `https://tiktok.com/@${handleOf(tiktok!)}`,
      icon: <TikTokIcon />,
    },
  ].filter(Boolean) as { label: string; handle: string; href: string; icon: React.ReactNode }[];

  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${s.label}: @${s.handle}`}
          className="flex items-center gap-3 border border-brand-white/10 hover:border-brand-yellow/50 px-3 py-2.5 group transition-colors min-w-0"
        >
          <span className="text-brand-white/50 group-hover:text-brand-yellow transition-colors shrink-0">{s.icon}</span>
          <span className="text-brand-white/80 group-hover:text-brand-white text-sm truncate">@{s.handle}</span>
          <span className="ml-auto text-brand-white/20 group-hover:text-brand-yellow text-xs shrink-0">↗</span>
        </a>
      ))}
    </div>
  );
}
