"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
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
  const isComingSoon = product.title === "Thragg Edition";
  const sizes = product.sizes ?? ["S", "M", "L", "XL"];

  return (
    <div className="group relative font-sans">
      <Link href={`/products/${product.id}`} className="block">

        {/* ── Media wrapper ── */}
        <div className="relative w-full overflow-hidden rounded-sm bg-[#f5f5f5]" style={{ aspectRatio: "3/4" }}>

          {/* Image */}
          {hasImage && (
            <Image
              src={product.image_url!}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05] ${
                hasVideo ? "opacity-0" : "opacity-100"
              }`}
              loading="lazy"
            />
          )}

          {/* Video */}
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

          {/* Placeholder */}
          {!hasImage && !hasVideo && (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              Asset Missing
            </div>
          )}

          {/* ── Badge ── */}
          <div className="absolute top-3 left-3 z-20">
            {isPromo ? (
              <span className="inline-flex items-center gap-1.5 bg-black/80 backdrop-blur-sm text-white text-[8px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5 rounded-[2px]">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Ends {timeLeft.hours.toString().padStart(2, "0")}:
                {timeLeft.minutes.toString().padStart(2, "0")}:
                {timeLeft.seconds.toString().padStart(2, "0")}
              </span>
            ) : isComingSoon ? (
              <span className="bg-black/75 backdrop-blur-sm text-white text-[8px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5 rounded-[2px]">
                Soon
              </span>
            ) : (
              <span className="bg-white/90 border border-black/8 text-black text-[8px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5 rounded-[2px]">
                New
              </span>
            )}
          </div>

          {/* Coming-soon overlay */}
          {isComingSoon && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
              <span className="text-white text-xs font-bold uppercase tracking-[0.3em] border-y border-white/30 py-2 px-5">
                Coming Soon
              </span>
            </div>
          )}

          {/* ── Hover: slide-up panel ── */}
          {!isComingSoon && (
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-white/97 backdrop-blur-md border-t border-black/6 translate-y-full group-hover:translate-y-0 transition-transform duration-[360ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
              <div className="flex gap-1.5">
                {sizes.slice(0, 5).map((sz) => (
                  <span
                    key={sz}
                    className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 border border-gray-200 rounded-[2px] text-gray-600 hover:bg-black hover:text-white hover:border-black transition-all"
                  >
                    {sz}
                  </span>
                ))}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-black whitespace-nowrap">
                Shop Now →
              </span>
            </div>
          )}

          {/* Soft gradient bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* ── Info ── */}
        <div className="mt-4 px-0.5">
          {/* Accent line */}
          <div
            className="h-[1.5px] bg-black mb-3 transition-all duration-500"
            style={{ width: "24px" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.width = "48px")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.width = "24px")}
          />

          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-black leading-snug flex-1 group-hover:text-gray-500 transition-colors duration-200">
              {product.title}
            </h3>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              {isPromo && (
                <span className="text-[9px] text-gray-400 line-through tracking-wide">
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className="text-[12px] font-bold text-black tracking-tight">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
