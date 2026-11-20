"use client";

import { isBestSeller } from "@/lib/productSorting";

import Link from "next/link";
import ProductImage from "@/components/products/ProductImage";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";

import { useCountdown } from "@/lib/useCountdown";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ShoppingBag } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const timeLeft = useCountdown();
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasImage = Boolean(product.image_url);
  const originalPrice = product.price === 480 ? 600 : Math.round(product.price * 1.25);
  const discountPercentage = originalPrice > product.price ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;
  const isPromo = product.title.toUpperCase() === "LIMITED OFFER";
  const bestSeller = isBestSeller(product.title);
  
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const xTo = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = card.getBoundingClientRect();
      const x = (clientX - left - width / 2) / 20;
      const y = -(clientY - top - height / 2) / 20;
      xTo(x);
      yTo(y);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="group relative font-sans will-change-transform" style={{ perspective: "1000px" }}>
      <Link href={`/products/${product.id}`} prefetch={false} className="block">
        <div ref={cardRef} className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface border border-border-light shadow-sm transition-all duration-500 group-hover:shadow-lg group-hover:shadow-black/20 card-glow">
          {/* Skeleton Loader */}
          {hasImage && !imageLoaded && (
            <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
          )}

          {hasImage && (
            <ProductImage
              src={product.image_url!}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover transition-all duration-1000 group-hover:scale-105 ${imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          )}

          {!hasImage && (
            <div className="flex h-full w-full items-center justify-center bg-surface text-muted text-[10px] font-semibold uppercase tracking-[0.2em]">
              Asset Missing
            </div>
          )}

          {isPromo ? (
            <div className="absolute top-6 left-6 backdrop-blur-md text-[9px] uppercase font-bold px-3 py-1.5 rounded-full border shadow-sm tracking-widest font-sans bg-accent text-white border-accent/30 flex items-center gap-1.5 animate-pulse z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Ends in {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}</span>
            </div>
          ) : (
            <div className="absolute top-2.5 sm:top-5 left-2.5 sm:left-5 flex flex-col gap-1 sm:gap-2 z-10">
              {bestSeller && (
                <div className="bg-white/90 backdrop-blur-sm text-zinc-900 text-[9px] sm:text-[10px] font-semibold px-2.5 sm:px-3 py-1 rounded-md shadow-sm font-sans w-fit">
                  Best Seller
                </div>
              )}
              <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-md w-fit">
                -{discountPercentage}%
              </div>
            </div>
          )}

          {product.title === "Thragg Edition" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-500">
              <span className="text-white text-xl font-bold uppercase tracking-[0.3em] border-y border-white/20 py-2 px-4 backdrop-blur-sm">
                Coming Soon
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3 transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 delay-75">
              <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-primary shadow-xl hover:scale-110 hover:bg-white transition-all cursor-pointer">
                <ShoppingBag size={20} />
              </div>
              <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">
                View Options
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 sm:mt-6 text-center px-2 sm:px-4 space-y-1 sm:space-y-2">
          <h3 className="text-xs sm:text-[14px] font-display font-medium text-foreground uppercase tracking-[0.08em] group-hover:text-accent transition-colors line-clamp-1">
            {product.title}
          </h3>

          <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-xl font-bold text-foreground tracking-tight">
              {formatPrice(product.price)}
            </span>
            <span className="text-[10px] sm:text-xs text-muted line-through">
              {formatPrice(originalPrice)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
