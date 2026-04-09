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
      className="group block"
    >
      {/* Product Image */}
      <div className="relative overflow-hidden bg-zinc-50 mb-6" style={{ aspectRatio: "3/4" }}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className="object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-50">
            <span className="text-zinc-200 font-display text-5xl tracking-widest">V</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-700" />
      </div>

      {/* Product Info */}
      <div className="space-y-2 px-1">
        <h3 className="text-base sm:text-lg font-medium text-zinc-900 leading-snug tracking-wide group-hover:text-zinc-500 transition-colors duration-500">
          {product.title}
        </h3>
        <p className="text-base font-display text-zinc-500 tracking-wider">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
