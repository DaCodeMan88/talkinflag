export default function MerchLoading() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="text-center mb-14 space-y-3">
          <div className="h-16 md:h-20 w-32 bg-brand-white/5 animate-pulse mx-auto" />
          <div className="h-4 w-56 bg-brand-white/5 animate-pulse mx-auto" />
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-brand-white/5">
              {/* Product image */}
              <div className="aspect-square bg-brand-white/5 animate-pulse" />
              {/* Product details */}
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-brand-white/5 animate-pulse" />
                <div className="h-3 w-1/2 bg-brand-white/5 animate-pulse" />
                <div className="h-8 w-full bg-brand-yellow/10 animate-pulse mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
