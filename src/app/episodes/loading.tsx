// Shown while the YouTube API response is being fetched on first load / cache miss.
// Mirrors the episodes page layout to reduce visual jump.
export default function EpisodesLoading() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title skeleton */}
        <div className="text-center mb-14">
          <div className="h-16 md:h-24 w-56 bg-brand-white/5 animate-pulse mx-auto rounded-sm" />
          <div className="h-4 w-80 bg-brand-white/5 animate-pulse mx-auto mt-4 rounded-sm" />
        </div>

        {/* Featured episode skeleton */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#222222] border border-brand-white/10 p-6">
          <div className="aspect-video bg-brand-white/5 animate-pulse rounded-sm" />
          <div className="flex flex-col justify-center gap-4">
            <div className="h-3 w-20 bg-brand-yellow/20 animate-pulse rounded-sm" />
            <div className="h-8 w-4/5 bg-brand-white/5 animate-pulse rounded-sm" />
            <div className="h-3 w-full bg-brand-white/5 animate-pulse rounded-sm" />
            <div className="h-3 w-3/4 bg-brand-white/5 animate-pulse rounded-sm" />
          </div>
        </div>

        {/* Search bar skeleton */}
        <div className="h-12 w-full bg-brand-white/5 animate-pulse rounded-sm mb-8" />

        {/* Episode grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#222222] border border-brand-white/10 overflow-hidden">
              <div className="aspect-video bg-brand-white/5 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-3/4 bg-brand-white/5 animate-pulse rounded-sm" />
                <div className="h-4 w-full bg-brand-white/5 animate-pulse rounded-sm" />
                <div className="h-3 w-1/2 bg-brand-white/5 animate-pulse rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
