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
    <div className="group relative font-sans">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface border border-border-light card-glow sm:transition-transform sm:duration-500 sm:group-hover:-translate-y-1.5">
          {hasImage && (
            <Image
              src={product.image_url!}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover sm:transition-transform sm:duration-1000 sm:group-hover:scale-105 ${
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
            <div className="absolute top-6 left-6 backdrop-blur-md text-[9px] uppercase font-bold px-3 py-1.5 rounded-full border shadow-sm tracking-widest font-sans bg-accent text-white border-accent/30 flex items-center gap-1.5 sm:animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white sm:animate-ping" />
              <span>Ends in {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}</span>
            </div>
          ) : (
            <div
              className={`absolute top-6 left-6 backdrop-blur-md text-[9px] uppercase font-semibold px-3 py-1.5 rounded-full border shadow-sm tracking-widest font-sans ${
                product.title === "Thragg Edition"
                  ? "bg-accent text-white border-accent/30"
                  : "bg-black/70 text-white border-white/10"
              }`}
            >
              {product.title === "Thragg Edition" ? "Coming Soon" : "Hero Edition"}
            </div>
          )}

          {product.title === "Thragg Edition" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-500">
              <span className="text-white text-xl font-bold uppercase tracking-[0.3em] border-y border-white/20 py-2 px-4 backdrop-blur-sm">
                Coming Soon
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 sm:group-hover:opacity-100 sm:transition-opacity hidden sm:flex items-end justify-center pb-8">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white shadow-xl shadow-accent/30">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </div>

        <div className="mt-6 text-center px-4 space-y-2">
          <h3 className="text-[16px] font-display font-normal text-foreground uppercase tracking-[0.15em] group-hover:text-accent transition-colors">
            {product.title}
          </h3>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted line-through tracking-widest font-medium">
              {formatPrice(originalPrice)}
            </span>
            <span className="text-sm font-bold text-accent tracking-tight">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
