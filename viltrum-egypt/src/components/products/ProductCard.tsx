"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
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
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Create original price for aesthetic
  const originalPrice = product.price * 1.25;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Subtle drift/float animation
    const randomDelay = Math.random() * 2;
    const randomDuration = 3 + Math.random() * 2;
    
    gsap.to(card, {
      y: -12,
      duration: randomDuration,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: randomDelay,
    });

    return () => {
      gsap.killTweensOf(card);
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className="group relative font-sans will-change-transform"
    >
      <Link 
        href={`/products/${product.id}`} 
        className="block"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-white border border-border-light shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-black/5 group-hover:-translate-y-4">
          {product.image_url ? (
            <>
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-0"
                loading="lazy"
              />
              <video
                ref={videoRef}
                src="/products/product-360.mp4"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none"
                autoPlay
                muted
                loop
                playsInline
              />
            </>
          ) : (
            <div className="w-full h-full bg-[#f6f5f4] flex items-center justify-center text-muted text-[10px] uppercase font-bold tracking-[0.2em]">
              Asset Missing
            </div>
          )}
          
          {/* Chic Floating Tag */}
          <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md text-black text-[9px] uppercase font-bold px-3 py-1.5 rounded-full border border-gray-100 shadow-sm tracking-widest">
            New Arrival
          </div>

          {/* Hover Explore Button */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
                <ArrowUpRight size={20} />
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-8 text-center px-4 space-y-3">
          <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.3em] group-hover:text-black transition-colors">
            {product.title}
          </h3>
          
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400 line-through tracking-widest font-medium">
              {formatPrice(originalPrice)}
            </span>
            <span className="text-sm font-bold text-black tracking-tight">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}


