// Shown while Supabase event data resolves on first load / cache miss.
// Mirrors the events page layout to reduce visual jump.
export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header skeleton */}
        <div className="mb-10">
          <div className="h-16 md:h-24 w-44 bg-brand-white/5 animate-pulse rounded-sm" />
          <div className="h-4 w-96 bg-brand-white/5 animate-pulse mt-4 rounded-sm" />
        </div>

        {/* Globe placeholder */}
        <div className="mb-16 bg-[#111111] border border-brand-yellow/20 p-8">
          <div className="h-6 w-72 bg-brand-yellow/10 animate-pulse rounded-sm mb-2" />
          <div className="h-4 w-48 bg-brand-white/5 animate-pulse rounded-sm mb-6" />
          <div className="h-64 bg-brand-white/5 animate-pulse rounded-sm" />
        </div>

        {/* Section header + filter pills */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-brand-white/5 animate-pulse rounded-sm" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-brand-white/5 animate-pulse rounded-sm" />
            ))}
          </div>
        </div>

        {/* Featured event skeleton */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#222222] border border-brand-white/10 p-6">
          <div className="space-y-3">
            <div className="h-3 w-24 bg-brand-yellow/20 animate-pulse rounded-sm" />
            <div className="h-8 w-4/5 bg-brand-white/5 animate-pulse rounded-sm" />
            <div className="h-3 w-full bg-brand-white/5 animate-pulse rounded-sm" />
            <div className="h-3 w-3/4 bg-brand-white/5 animate-pulse rounded-sm" />
            <div className="h-10 w-36 bg-brand-yellow/10 animate-pulse rounded-sm mt-4" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-brand-white/5 animate-pulse rounded-sm" />
            ))}
          </div>
        </div>

        {/* Event cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-brand-white/10 p-5 space-y-3">
              <div className="h-3 w-20 bg-brand-yellow/20 animate-pulse rounded-sm" />
              <div className="h-5 w-4/5 bg-brand-white/5 animate-pulse rounded-sm" />
              <div className="h-3 w-1/2 bg-brand-white/5 animate-pulse rounded-sm" />
              <div className="h-3 w-2/3 bg-brand-white/5 animate-pulse rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
