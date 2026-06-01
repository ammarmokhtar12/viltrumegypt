/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, react-hooks/exhaustive-deps, @typescript-eslint/no-require-imports */
"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
import { ArrowUpRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Create original price for aesthetic
  const originalPrice = product.price * 1.25;

  return (
    <div 
      className="group relative font-sans will-change-transform"
    >
      <Link 
        href={`/products/${product.id}`} 
        className="block"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white border border-border-light shadow-sm transition-all duration-500 group-hover:shadow-lg group-hover:shadow-black/5 group-hover:-translate-y-1.5">
          {product.image_url ? (
            <>
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-0"
                loading="lazy"
              />
              <video
                ref={videoRef}
                src={product.video_url || "/products/product-360.mp4"}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none"
                autoPlay
                muted
                loop
                playsInline
              />
            </>
          ) : (
            <div className="w-full h-full bg-surface flex items-center justify-center text-muted text-[10px] uppercase font-bold tracking-[0.2em]">
              Asset Missing
            </div>
          )}
          
          {/* Chic Floating Tag */}
          <div className={`absolute top-6 left-6 backdrop-blur-md text-[9px] uppercase font-semibold px-3 py-1.5 rounded-full border shadow-sm tracking-widest font-sans ${
            product.title === "Thragg Edition" 
              ? "bg-primary text-white border-white/10" 
              : "bg-white/90 text-primary border-border-light"
          }`}>
            {product.title === "Thragg Edition" ? "Coming Soon" : "New Arrival"}
          </div>

          {product.title === "Thragg Edition" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-500">
              <span className="text-white text-xl font-bold uppercase tracking-[0.3em] border-y border-white/20 py-2 px-4 backdrop-blur-sm">Coming Soon</span>
            </div>
          )}

          {/* Hover Explore Button */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
                 <ArrowUpRight size={20} />
              </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-8 text-center px-4 space-y-3">
          <h3 className="text-[15px] font-serif font-medium text-foreground uppercase tracking-[0.12em] group-hover:text-accent transition-colors">
            {product.title}
          </h3>
          
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted line-through tracking-widest font-medium">
              {formatPrice(originalPrice)}
            </span>
            <span className="text-sm font-bold text-primary tracking-tight">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}


