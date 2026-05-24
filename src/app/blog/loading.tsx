export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14">
          <div className="h-16 md:h-20 w-40 bg-brand-white/5 animate-pulse" />
          <div className="h-4 w-72 bg-brand-white/5 animate-pulse mt-3" />
        </div>

        {/* Category pills skeleton */}
        <div className="flex flex-wrap gap-2 mb-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-brand-white/5 animate-pulse" />
          ))}
        </div>

        {/* Post cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-brand-white/5 p-6 flex flex-col gap-3">
              <div className="h-3 w-20 bg-brand-white/5 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-full bg-brand-white/5 animate-pulse" />
                <div className="h-5 w-4/5 bg-brand-white/5 animate-pulse" />
                <div className="h-5 w-3/5 bg-brand-white/5 animate-pulse" />
              </div>
              <div className="space-y-1.5 mt-1">
                <div className="h-3.5 w-full bg-brand-white/5 animate-pulse" />
                <div className="h-3.5 w-5/6 bg-brand-white/5 animate-pulse" />
                <div className="h-3.5 w-4/6 bg-brand-white/5 animate-pulse" />
              </div>
              <div className="flex justify-between mt-auto pt-4 border-t border-brand-white/5">
                <div className="h-3 w-20 bg-brand-white/5 animate-pulse" />
                <div className="h-3 w-24 bg-brand-white/5 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
