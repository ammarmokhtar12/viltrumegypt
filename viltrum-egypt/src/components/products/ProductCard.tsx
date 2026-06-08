"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
import { ArrowUpRight } from "lucide-react";
import { useCountdown } from "@/lib/useCountdown";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const timeLeft = useCountdown();
  const hasImage = Boolean(product.image_url);
  const hasVideo = Boolean(product.video_url) && !videoFailed;
  const originalPrice = product.price * 1.25;
  const isPromo = product.title.toUpperCase() === "LIMITED OFFER";

  return (
    <div className="group relative font-sans will-change-transform">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white border border-border-light shadow-sm transition-all duration-500 group-hover:shadow-lg group-hover:shadow-black/5 group-hover:-translate-y-1.5">
          {hasImage && (
            <Image
              src={product.image_url!}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover transition-transform duration-1000 group-hover:scale-105 ${
                hasVideo ? "opacity-0" : "opacity-100"
              }`}
              loading="lazy"
            />
          )}

          {product.video_url && !videoFailed && (
            <video
              src={product.video_url}
              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
              autoPlay
              muted
              loop
              playsInline
              onError={() => setVideoFailed(true)}
            />
          )}

          {!hasImage && !hasVideo && (
            <div className="flex h-full w-full items-center justify-center bg-surface text-muted text-[10px] font-semibold uppercase tracking-[0.2em]">
              Asset Missing
            </div>
          )}

          {isPromo ? (
            <div className="absolute top-6 left-6 backdrop-blur-md text-[9px] uppercase font-bold px-3 py-1.5 rounded-full border shadow-sm tracking-widest font-sans bg-primary text-white border-white/10 flex items-center gap-1.5 animate-pulse">
              <span className="w-1 h-1 rounded-full bg-white animate-ping" />
              <span>Ends in {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}</span>
            </div>
          ) : (
            <div
              className={`absolute top-6 left-6 backdrop-blur-md text-[9px] uppercase font-semibold px-3 py-1.5 rounded-full border shadow-sm tracking-widest font-sans ${
                product.title === "Thragg Edition"
                  ? "bg-primary text-white border-white/10"
                  : "bg-white/90 text-primary border-border-light"
              }`}
            >
              {product.title === "Thragg Edition" ? "Coming Soon" : "New Arrival"}
            </div>
          )}

          {product.title === "Thragg Edition" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-500">
              <span className="text-white text-xl font-bold uppercase tracking-[0.3em] border-y border-white/20 py-2 px-4 backdrop-blur-sm">
                Coming Soon
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </div>

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
