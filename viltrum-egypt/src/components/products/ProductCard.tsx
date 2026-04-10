"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block w-full"
    >
      <div className="flex flex-col space-y-4">
        {/* Stark Image Container - No borders, no rounding */}
        <div className="relative w-full overflow-hidden bg-[#f4f4f4]" style={{ aspectRatio: "3/4" }}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover object-center mix-blend-multiply opacity-95 transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[#f4f4f4]">
              <span className="text-4xl font-display font-bold tracking-widest text-[#d4d4d4]">VILTRUM</span>
              <span className="text-[10px] font-bold uppercase tracking-widest mt-2 text-[#d4d4d4]">Archive</span>
            </div>
          )}
          
          {/* Quick Add Brutalist Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 flex justify-center">
             <div className="bg-foreground text-background text-[10px] uppercase font-bold tracking-widest py-3 px-6 w-full text-center hover:bg-background hover:text-foreground hover:border-foreground border border-transparent transition-colors">
                View Object
             </div>
          </div>
        </div>

        {/* Stark Typography Details */}
        <div className="flex flex-col items-start w-full">
           <div className="flex w-full justify-between items-baseline mb-1">
             <h3 className="text-[13px] font-bold uppercase tracking-wider text-foreground truncate max-w-[70%]">
               {product.title}
             </h3>
             <span className="text-[13px] font-bold text-foreground">
               {formatPrice(product.price)}
             </span>
           </div>
           <p className="text-[10px] uppercase font-semibold text-muted tracking-widest">
              Core Collection
           </p>
        </div>
      </div>
    </Link>
  );
}
