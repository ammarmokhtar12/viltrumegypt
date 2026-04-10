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
      className="group block transition-transform duration-300 hover:scale-[1.02]"
    >
      <div className="overflow-hidden rounded-3xl border border-border-light bg-background p-4">
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-secondary" style={{ aspectRatio: "3/4" }}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary">
              <span className="text-5xl font-display tracking-widest text-secondary opacity-50">V</span>
            </div>
          )}

          <div className="absolute inset-0 bg-primary/0 transition-colors duration-500 group-hover:bg-primary/5" />
        </div>

        <div className="space-y-2 px-1 pb-1">
          <h3 className="text-base font-bold leading-snug tracking-tight text-foreground transition-colors duration-300 sm:text-lg uppercase">
            {product.title}
          </h3>
          <p className="text-base font-display tracking-widest font-semibold text-secondary">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}
