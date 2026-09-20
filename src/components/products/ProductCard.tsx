"use client";

import Link from "next/link";
import ProductImage from "@/components/products/ProductImage";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
import { ArrowUpRight } from "lucide-react";
import { useCountdown } from "@/lib/useCountdown";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Star, ShoppingBag } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const timeLeft = useCountdown();
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasImage = Boolean(product.image_url);
  const originalPrice = product.price * 1.25;
  const discountPercentage = Math.round(((originalPrice - product.price) / originalPrice) * 100);
  const isPromo = product.title.toUpperCase() === "LIMITED OFFER";
  
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
      <Link href={`/products/${product.id}`} className="block">
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
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
              <div
                className={`backdrop-blur-md text-[9px] uppercase font-semibold px-3 py-1.5 rounded-full border shadow-sm tracking-widest font-sans inline-flex w-fit ${
                  product.title === "Thragg Edition"
                    ? "bg-accent text-white border-accent/30"
                    : "bg-black/60 text-white border-white/10"
                }`}
              >
                {product.title === "Thragg Edition" ? "Coming Soon" : "Hero Edition"}
              </div>
              <div className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full border border-red-400/30 shadow-sm w-fit">
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

        <div className="mt-6 text-center px-4 space-y-2.5">
          <div className="flex items-center justify-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={12} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="text-[10px] text-muted ml-1 font-medium">(42)</span>
          </div>

          <h3 className="text-[14px] font-display font-medium text-foreground uppercase tracking-[0.1em] group-hover:text-accent transition-colors line-clamp-1">
            {product.title}
          </h3>

          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold text-primary tracking-tight">
              {formatPrice(product.price)}
            </span>
            <span className="text-[11px] text-muted line-through tracking-widest font-medium">
              {formatPrice(originalPrice)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
