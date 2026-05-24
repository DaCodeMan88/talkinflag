// Shown while Supabase event data resolves for an event detail page.
export default function EventDetailLoading() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link skeleton */}
        <div className="h-4 w-28 bg-brand-white/5 animate-pulse rounded-sm mb-10" />

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-6 w-24 bg-brand-white/5 animate-pulse rounded-sm" />
          ))}
        </div>

        {/* Title */}
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <div className="h-12 md:h-16 w-4/5 bg-brand-white/5 animate-pulse rounded-sm" />
          <div className="h-4 w-1/2 bg-brand-white/5 animate-pulse rounded-sm mt-4" />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Left: facts */}
          <div className="space-y-6">
            <div className="bg-[#111111] border border-brand-white/10 p-6 space-y-4">
              <div className="h-3 w-20 bg-brand-yellow/20 animate-pulse rounded-sm" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-16 bg-brand-white/5 animate-pulse rounded-sm" />
                  <div className="h-4 w-28 bg-brand-white/5 animate-pulse rounded-sm" />
                </div>
              ))}
            </div>
            <div className="h-12 w-36 bg-brand-yellow/10 animate-pulse rounded-sm" />
          </div>

          {/* Right: description */}
          <div className="space-y-3">
            <div className="h-3 w-28 bg-brand-yellow/20 animate-pulse rounded-sm" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 bg-brand-white/5 animate-pulse rounded-sm" style={{ width: `${75 + (i % 4) * 6}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
