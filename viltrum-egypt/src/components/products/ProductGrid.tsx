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
          <h2 className="text-3xl md:text-5xl font-normal text-foreground mb-4">
            Collection Empty
          </h2>
          <p className="text-muted text-lg">
            New arrivals coming soon.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="bg-white py-16 md:py-24 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-4xl">
             <div className="flex-1">
                <h2 className="text-3xl md:text-5xl lg:text-5xl text-foreground font-normal leading-tight mb-4">
                  Our Favourite Collection
                </h2>
                <p className="text-muted text-base md:text-lg leading-relaxed max-w-2xl">
                  We are inspired by the realities of life today, in which traditional divides between personal and professional wear are more fluid.
                </p>
             </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-x-10 md:gap-y-16">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

