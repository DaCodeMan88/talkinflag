export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <div className="h-4 w-20 bg-brand-white/5 animate-pulse mb-10" />

        {/* Category */}
        <div className="h-3 w-24 bg-brand-yellow/20 animate-pulse mb-2" />

        {/* Title */}
        <div className="space-y-2 mb-4">
          <div className="h-10 w-full bg-brand-white/5 animate-pulse" />
          <div className="h-10 w-5/6 bg-brand-white/5 animate-pulse" />
          <div className="h-10 w-3/5 bg-brand-white/5 animate-pulse" />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-3 w-24 bg-brand-white/5 animate-pulse" />
          <div className="h-3 w-3 bg-brand-white/5 animate-pulse rounded-full" />
          <div className="h-3 w-28 bg-brand-white/5 animate-pulse" />
          <div className="h-3 w-3 bg-brand-white/5 animate-pulse rounded-full" />
          <div className="h-3 w-16 bg-brand-white/5 animate-pulse" />
        </div>

        {/* Pull quote */}
        <div className="border-l-2 border-brand-yellow/30 pl-5 mb-10 space-y-2">
          <div className="h-5 w-full bg-brand-white/5 animate-pulse" />
          <div className="h-5 w-11/12 bg-brand-white/5 animate-pulse" />
          <div className="h-5 w-4/5 bg-brand-white/5 animate-pulse" />
        </div>

        {/* Body */}
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-brand-white/5 animate-pulse"
              style={{ width: `${75 + Math.floor((i * 17) % 25)}%` }}
            />
          ))}
          <div className="h-6 w-48 bg-brand-white/5 animate-pulse mt-6" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`b-${i}`}
              className="h-4 bg-brand-white/5 animate-pulse"
              style={{ width: `${70 + Math.floor((i * 13) % 28)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
