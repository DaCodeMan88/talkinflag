import Image from "next/image";
import { PrintfulProduct } from "@/lib/printful";

export function ProductCard({ product }: { product: PrintfulProduct }) {
  return (
    <article className="bg-[#222222] border border-brand-white/10 hover:border-brand-yellow/40 transition-all duration-300 overflow-hidden group">
      <div className="relative aspect-square overflow-hidden bg-[#111111]">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-brand-white/20 font-display uppercase text-sm">No Image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display uppercase text-brand-white text-sm leading-snug">{product.name}</h3>
        {product.variants?.[0] && (
          <p className="text-brand-yellow font-display text-sm mt-1">
            ${product.variants[0].retail_price}
          </p>
        )}
        <button
          className="mt-3 w-full bg-brand-yellow text-brand-black font-display uppercase text-xs tracking-widest py-2 hover:bg-yellow-400 transition-colors"
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}
