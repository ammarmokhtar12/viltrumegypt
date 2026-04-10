"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Concept: Mocking an original price for the Furnish "sale" aesthetic
  const originalPrice = product.price * 1.2;

  return (
    <div className="group font-sans">
      <Link href={`/products/${product.id}`} className="block overflow-hidden bg-white">
        <div className="relative aspect-[4/5] w-full overflow-hidden mb-4">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-[#f6f5f4] flex items-center justify-center text-muted text-xs uppercase tracking-widest">
              No Image
            </div>
          )}
          
          {/* Sale Badge (Optional for concept) */}
          <div className="absolute top-4 left-4 bg-secondary text-white text-[10px] uppercase font-bold px-2 py-1">
            Sale
          </div>
        </div>

        <div className="text-center px-2">
          <h3 className="text-lg font-normal text-foreground group-hover:text-secondary transition-colors truncate mb-1">
            {product.title}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-semibold text-muted line-through">
              {formatPrice(originalPrice)}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

