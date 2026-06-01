"use client";

import ProductCard from "./ProductCard";
import { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <section id="products" className="bg-white py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl type-headline mb-4">Collection Empty</h2>
          <p className="type-eyebrow">New arrivals coming soon</p>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-4xl">
            <div className="flex-1">
              <p className="type-eyebrow mb-3">Curated Selection</p>
              <h2 className="text-4xl md:text-6xl type-headline">The Archive</h2>
              <p className="type-eyebrow !normal-case !tracking-normal text-secondary text-sm mt-4 max-w-2xl leading-relaxed font-normal">
                Forged for the relentless. Built for the elite.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-x-10 md:gap-y-16">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
