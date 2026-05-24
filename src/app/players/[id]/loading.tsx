// Shown while Supabase player data resolves for a profile detail page.
export default function PlayerDetailLoading() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link skeleton */}
        <div className="h-4 w-32 bg-brand-white/5 animate-pulse rounded-sm mb-10" />

        {/* Header: name + badges */}
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <div className="h-16 md:h-24 w-80 bg-brand-white/5 animate-pulse rounded-sm" />
          <div className="flex gap-3 mt-4">
            <div className="h-7 w-20 bg-brand-yellow/20 animate-pulse rounded-sm" />
            <div className="h-7 w-28 bg-brand-white/5 animate-pulse rounded-sm" />
          </div>
          <div className="flex gap-3 mt-4">
            <div className="h-7 w-28 bg-brand-white/5 animate-pulse rounded-sm" />
            <div className="h-7 w-32 bg-brand-white/5 animate-pulse rounded-sm" />
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-[#111111] border border-brand-white/10 p-6 space-y-4">
              <div className="h-3 w-20 bg-brand-yellow/20 animate-pulse rounded-sm" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 bg-brand-white/5 animate-pulse rounded-sm" />
                  <div className="h-4 w-24 bg-brand-white/5 animate-pulse rounded-sm" />
                </div>
              ))}
            </div>
            <div className="bg-[#111111] border border-brand-white/10 p-6 space-y-4">
              <div className="h-3 w-24 bg-brand-yellow/20 animate-pulse rounded-sm" />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-brand-white/5 animate-pulse rounded-sm" />
                  <div className="h-4 w-12 bg-brand-white/5 animate-pulse rounded-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#111111] border border-brand-white/10 p-6">
              <div className="h-3 w-16 bg-brand-yellow/20 animate-pulse rounded-sm mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 bg-brand-white/5 animate-pulse rounded-sm" style={{ width: `${80 + (i % 3) * 7}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
