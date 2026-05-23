import { getProducts } from "@/lib/printful";
import { ProductCard } from "@/components/merch/ProductCard";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Merch | Talkin Flag — Rep the Flag Football Movement",
  description: "Official Talkin Flag merchandise. Rep the global flag football movement.",
};

export default async function MerchPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Merch</h1>
          <p className="mt-4 text-brand-white/60">Rep the flag football movement.</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 border border-brand-yellow/20 bg-[#111111]">
            <p className="font-display text-2xl uppercase text-brand-yellow mb-3">Coming Soon</p>
            <p className="text-brand-white/60 text-sm max-w-md mx-auto">
              Talkin Flag gear is on the way. Follow us on Instagram for the drop announcement.
            </p>
            <a
              href="https://instagram.com/talkinflagshow"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline"
            >
              @talkinflagshow ↗
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
