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
    <div className="product-card group">
      <Link href={`/products/${product.id}`} className="block">
        {/* ── Image wrapper ── */}
        <div className="product-card__media">

          {/* Image */}
          {hasImage && (
            <Image
              src={product.image_url!}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.25,.46,.45,.94)] group-hover:scale-[1.06] ${
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
            <div className="flex h-full w-full items-center justify-center bg-surface text-muted text-[10px] font-semibold uppercase tracking-[0.2em]">
              Asset Missing
            </div>
          )}

          {/* ── Top badges ── */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {isPromo && (
              <span className="product-card__badge product-card__badge--promo">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Ends {timeLeft.hours.toString().padStart(2, "0")}:
                {timeLeft.minutes.toString().padStart(2, "0")}:
                {timeLeft.seconds.toString().padStart(2, "0")}
              </span>
            )}
            {!isPromo && !isComingSoon && (
              <span className="product-card__badge product-card__badge--new">
                New
              </span>
            )}
            {isComingSoon && (
              <span className="product-card__badge product-card__badge--soon">
                Soon
              </span>
            )}
          </div>

          {/* Coming-soon full overlay */}
          {isComingSoon && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
              <span className="text-white text-sm font-bold uppercase tracking-[0.35em] border-y border-white/30 py-2 px-6">
                Coming Soon
              </span>
            </div>
          )}

          {/* ── Hover slide-up panel ── */}
          {!isComingSoon && (
            <div className="product-card__hover-panel">
              <div className="product-card__sizes">
                {sizes.slice(0, 5).map((sz) => (
                  <span key={sz} className="product-card__size-chip">{sz}</span>
                ))}
              </div>
              <span className="product-card__cta">Shop Now →</span>
            </div>
          )}

          {/* Subtle gradient overlay always */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* ── Info block ── */}
        <div className="product-card__info">
          {/* Thin accent line */}
          <div className="product-card__accent-line" />

          <div className="flex items-start justify-between gap-3">
            <h3 className="product-card__title">{product.title}</h3>

            <div className="product-card__price-block">
              {isPromo && (
                <span className="product-card__original-price">
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className="product-card__price">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <style jsx>{`
        .product-card {
          position: relative;
          font-family: var(--font-sans, system-ui, sans-serif);
        }

        .product-card__media {
          position: relative;
          aspect-ratio: 3/4;
          width: 100%;
          overflow: hidden;
          border-radius: 4px;
          background: #f4f4f4;
        }

        /* ── Badges ── */
        .product-card__badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 2px;
          backdrop-filter: blur(8px);
        }
        .product-card__badge--promo {
          background: rgba(0,0,0,0.75);
          color: #fff;
          animation: pulse 2s infinite;
        }
        .product-card__badge--new {
          background: rgba(255,255,255,0.92);
          color: #111;
          border: 1px solid rgba(0,0,0,0.08);
        }
        .product-card__badge--soon {
          background: rgba(0,0,0,0.7);
          color: #fff;
        }

        /* ── Hover slide-up ── */
        .product-card__hover-panel {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(0,0,0,0.06);
          transform: translateY(100%);
          transition: transform 0.38s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .product-card:hover .product-card__hover-panel,
        .group:hover .product-card__hover-panel {
          transform: translateY(0);
        }

        .product-card__sizes {
          display: flex;
          gap: 6px;
        }
        .product-card__size-chip {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 8px;
          border: 1px solid #e0e0e0;
          border-radius: 2px;
          color: #333;
          background: #fff;
          transition: border-color 0.2s, background 0.2s, color 0.2s;
        }
        .product-card__size-chip:hover {
          background: #111;
          color: #fff;
          border-color: #111;
        }

        .product-card__cta {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #111;
          white-space: nowrap;
        }

        /* ── Info ── */
        .product-card__info {
          margin-top: 14px;
          padding: 0 2px;
        }

        .product-card__accent-line {
          width: 24px;
          height: 1.5px;
          background: #111;
          margin-bottom: 10px;
          transition: width 0.4s ease;
        }
        .product-card:hover .product-card__accent-line,
        .group:hover .product-card__accent-line {
          width: 48px;
        }

        .product-card__title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #111;
          line-height: 1.4;
          flex: 1;
          transition: color 0.2s;
        }
        .product-card:hover .product-card__title,
        .group:hover .product-card__title {
          color: #555;
        }

        .product-card__price-block {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }
        .product-card__original-price {
          font-size: 10px;
          color: #aaa;
          text-decoration: line-through;
          letter-spacing: 0.05em;
        }
        .product-card__price {
          font-size: 13px;
          font-weight: 700;
          color: #111;
          letter-spacing: 0.04em;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
