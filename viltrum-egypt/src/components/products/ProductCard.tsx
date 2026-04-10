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
      <div className="overflow-hidden rounded-2xl bg-surface border border-border-light transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
        <div className="relative overflow-hidden bg-background" style={{ aspectRatio: "3/4" }}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface">
              <span className="text-5xl font-display tracking-widest text-muted/30">V</span>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          {/* Quick view label */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="rounded-full bg-surface/90 backdrop-blur-sm px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-foreground shadow-lg">
              View Details
            </span>
          </div>
        </div>

        <div className="p-4 space-y-1.5">
          <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-1">
            {product.title}
          </h3>
          <p className="text-sm font-bold text-secondary">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}
