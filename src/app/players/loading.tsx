// Shown while the Supabase player fetch resolves on first load / cache miss.
// Mirrors the players page layout to reduce visual jump.
export default function PlayersLoading() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title skeleton */}
        <div className="text-center mb-10">
          <div className="h-16 md:h-24 w-52 bg-brand-white/5 animate-pulse mx-auto rounded-sm" />
          <div className="h-4 w-80 bg-brand-white/5 animate-pulse mx-auto mt-4 rounded-sm" />
        </div>

        {/* Position pills skeleton */}
        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-16 bg-brand-white/5 animate-pulse rounded-sm" />
          ))}
        </div>

        {/* Level pills skeleton */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-brand-white/5 animate-pulse rounded-sm" />
          ))}
        </div>

        {/* Search input skeleton */}
        <div className="h-11 w-full max-w-sm bg-brand-white/5 animate-pulse rounded-sm mb-10" />

        {/* Rankings table skeleton */}
        <div className="mb-10 bg-[#111111] border border-brand-white/10 overflow-hidden">
          <div className="h-10 bg-brand-yellow/5 border-b border-brand-white/10 animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 border-b border-brand-white/5 px-4 flex items-center gap-4"
            >
              <div className="w-8 h-4 bg-brand-white/5 animate-pulse rounded-sm shrink-0" />
              <div className="w-40 h-4 bg-brand-white/5 animate-pulse rounded-sm" />
              <div className="w-20 h-4 bg-brand-white/5 animate-pulse rounded-sm ml-auto" />
              <div className="w-16 h-4 bg-brand-white/5 animate-pulse rounded-sm" />
            </div>
          ))}
        </div>

        {/* Player card grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-brand-white/10 overflow-hidden">
              <div className="aspect-video bg-brand-white/5 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-14 bg-brand-yellow/20 animate-pulse rounded-sm" />
                <div className="h-5 w-4/5 bg-brand-white/5 animate-pulse rounded-sm" />
                <div className="h-3 w-1/2 bg-brand-white/5 animate-pulse rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
