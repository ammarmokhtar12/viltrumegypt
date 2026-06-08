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
    <div className="group relative font-sans w-full">
      <Link href={`/products/${product.id}`} className="block w-full">

        {/* ── Media wrapper: padding-bottom trick for reliable 3:4 ratio ── */}
        <div className="relative w-full overflow-hidden rounded-sm bg-gray-100" style={{ paddingBottom: "133.33%" }}>
          <div className="absolute inset-0">

            {/* Image */}
            {hasImage && (
              <Image
                src={product.image_url!}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
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
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-widest text-gray-400">
                No Image
              </div>
            )}

            {/* ── Badge ── */}
            <div className="absolute top-3 left-3 z-20">
              {isPromo ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(0,0,0,0.80)",
                    color: "#fff",
                    fontSize: "8px",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    padding: "5px 10px",
                    borderRadius: "2px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#fff",
                      display: "inline-block",
                      animation: "ping 1.2s infinite",
                    }}
                  />
                  Ends {timeLeft.hours.toString().padStart(2, "0")}:
                  {timeLeft.minutes.toString().padStart(2, "0")}:
                  {timeLeft.seconds.toString().padStart(2, "0")}
                </span>
              ) : isComingSoon ? (
                <span
                  style={{
                    background: "rgba(0,0,0,0.72)",
                    color: "#fff",
                    fontSize: "8px",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    padding: "5px 10px",
                    borderRadius: "2px",
                  }}
                >
                  Soon
                </span>
              ) : (
                <span
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    color: "#111",
                    fontSize: "8px",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    padding: "5px 10px",
                    borderRadius: "2px",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  New
                </span>
              )}
            </div>

            {/* Coming-soon overlay */}
            {isComingSoon && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(2px)" }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    borderTop: "1px solid rgba(255,255,255,0.3)",
                    borderBottom: "1px solid rgba(255,255,255,0.3)",
                    padding: "8px 20px",
                  }}
                >
                  Coming Soon
                </span>
              </div>
            )}

            {/* ── Hover: slide-up panel ── */}
            {!isComingSoon && (
              <div
                className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between"
                style={{
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.97)",
                  backdropFilter: "blur(10px)",
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                  transform: "translateY(100%)",
                  transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
                }}
                // @ts-ignore – CSS custom property for group hover
                data-hover-panel
              >
                <div style={{ display: "flex", gap: "6px" }}>
                  {sizes.slice(0, 5).map((sz) => (
                    <span
                      key={sz}
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        padding: "4px 8px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "2px",
                        color: "#444",
                        background: "#fff",
                      }}
                    >
                      {sz}
                    </span>
                  ))}
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#111",
                    whiteSpace: "nowrap",
                  }}
                >
                  Shop Now →
                </span>
              </div>
            )}

            {/* Gradient */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.12) 0%, transparent 40%)" }}
            />
          </div>
        </div>

        {/* ── Info ── */}
        <div style={{ marginTop: "14px", padding: "0 2px" }}>
          <div
            style={{
              width: "24px",
              height: "1.5px",
              background: "#111",
              marginBottom: "10px",
              transition: "width 0.4s ease",
            }}
          />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <h3
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#111",
                lineHeight: 1.4,
                flex: 1,
              }}
            >
              {product.title}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
              {isPromo && (
                <span style={{ fontSize: "9px", color: "#aaa", textDecoration: "line-through", letterSpacing: "0.05em" }}>
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#111", letterSpacing: "0.04em" }}>
                {formatPrice(product.price)}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Global hover styles for the slide-up panel */}
      <style>{`
        .group:hover [data-hover-panel] {
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}
