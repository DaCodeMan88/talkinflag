export default function RecruitLoading() {
  return (
    <div className="min-h-screen bg-brand-black">
      {/* Hero skeleton */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-3 w-40 bg-brand-yellow/20 animate-pulse" />
          <div className="space-y-2">
            <div className="h-14 md:h-20 w-3/4 bg-brand-white/5 animate-pulse" />
            <div className="h-14 md:h-20 w-1/2 bg-brand-yellow/10 animate-pulse" />
            <div className="h-14 md:h-20 w-2/3 bg-brand-white/5 animate-pulse" />
          </div>
          <div className="space-y-2 max-w-xl">
            <div className="h-4 w-full bg-brand-white/5 animate-pulse" />
            <div className="h-4 w-5/6 bg-brand-white/5 animate-pulse" />
            <div className="h-4 w-4/6 bg-brand-white/5 animate-pulse" />
          </div>
          <div className="h-12 w-48 bg-brand-yellow/20 animate-pulse" />
        </div>
      </section>

      {/* Features skeleton */}
      <section className="py-20 px-4 border-t border-brand-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-40 bg-brand-white/5 animate-pulse mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-brand-white/5 bg-[#111111] p-6 space-y-3">
                <div className="w-8 h-1 bg-brand-yellow/30" />
                <div className="h-5 w-3/4 bg-brand-white/5 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-full bg-brand-white/5 animate-pulse" />
                  <div className="h-3.5 w-5/6 bg-brand-white/5 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Players showcase skeleton */}
      <section className="py-20 px-4 border-t border-brand-white/10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-56 bg-brand-white/5 animate-pulse mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#111111] border border-brand-white/5 h-40 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
