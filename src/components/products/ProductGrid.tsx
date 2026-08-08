"use client";

import ProductCard from "./ProductCard";
import { Product } from "@/types";
import StoreDataAlert from "@/components/store/StoreDataAlert";

interface ProductGridProps {
  products: Product[];
  fetchError?: string | null;
}

export default function ProductGrid({ products, fetchError }: ProductGridProps) {
  if (fetchError) {
    return null;
  }

  if (products.length === 0) {
    return (
      <section id="products" className="bg-background py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl type-headline mb-4">Collection Empty</h2>
          <p className="type-eyebrow mb-8">New arrivals coming soon</p>
          <StoreDataAlert
            message="No active products in the store yet. Add items from the admin dashboard."
            variant="warning"
          />
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="bg-background py-16 md:py-24 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/3 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-blue/3 rounded-full blur-[200px] pointer-events-none" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-4xl">
            <div className="flex-1">
              <p className="type-eyebrow mb-3 !text-accent !text-sm">Heroes Collection</p>
              <h2 className="text-4xl md:text-6xl type-headline">The Armory</h2>
              <p className="text-secondary text-sm mt-4 max-w-lg leading-relaxed font-sans">
                Every hero needs their armor. Choose your identity.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-8 md:gap-x-10 md:gap-y-16">
          {products
            .filter((p) => p.title.toUpperCase() !== "LIMITED OFFER")
            .map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
