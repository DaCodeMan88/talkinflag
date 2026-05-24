// Shown while YouTube API data resolves for an episode detail page.
export default function EpisodeDetailLoading() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link skeleton */}
        <div className="h-4 w-28 bg-brand-white/5 animate-pulse rounded-sm mb-8" />

        {/* Video embed placeholder */}
        <div className="aspect-video w-full mb-8 bg-[#111111] animate-pulse" />

        {/* Badge + date */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-16 bg-brand-yellow/20 animate-pulse rounded-sm" />
          <div className="h-4 w-28 bg-brand-white/5 animate-pulse rounded-sm" />
        </div>

        {/* Title */}
        <div className="space-y-2 mb-2">
          <div className="h-10 w-3/4 bg-brand-white/5 animate-pulse rounded-sm" />
          <div className="h-8 w-1/2 bg-brand-white/5 animate-pulse rounded-sm" />
        </div>

        {/* Subtitle */}
        <div className="h-4 w-2/3 bg-brand-white/5 animate-pulse rounded-sm mt-2 mb-6" />

        {/* Action row */}
        <div className="flex flex-wrap gap-3 pb-8 border-b border-brand-white/10">
          <div className="h-9 w-40 bg-brand-yellow/20 animate-pulse rounded-sm" />
          <div className="h-9 w-28 bg-brand-white/5 animate-pulse rounded-sm" />
          <div className="h-9 w-36 bg-brand-white/5 animate-pulse rounded-sm" />
          <div className="h-9 w-28 bg-brand-white/5 animate-pulse rounded-sm" />
        </div>

        {/* Description */}
        <div className="mt-6 space-y-3">
          <div className="h-3 w-32 bg-brand-yellow/20 animate-pulse rounded-sm" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-brand-white/5 animate-pulse rounded-sm" style={{ width: `${85 + (i % 3) * 5}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
