"use client";

import { useCountdown } from "@/lib/useCountdown";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Flame } from "lucide-react";

interface PromoCountdownBannerProps {
  products: Product[];
}

export default function PromoCountdownBanner({ products }: PromoCountdownBannerProps) {
  const timeLeft = useCountdown();

  // Find the product named "LIMITED OFFER" (case-insensitive)
  const promoProduct = products.find(
    (p) => p.title.toUpperCase() === "LIMITED OFFER" && p.is_active
  );

  if (!promoProduct) return null;

  const originalPrice = promoProduct.price * 1.25;

  return (
    <section className="w-full bg-surface py-12 md:py-16 border-y border-border-light relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Promo Text and Countdown */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-full text-accent font-sans text-[10px] font-bold uppercase tracking-[0.2em]">
              <Flame size={12} className="animate-pulse text-accent" />
              <span>Limited Time Daily Offer</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl lg:text-6xl type-headline font-bold leading-none tracking-tight">
                {promoProduct.title}
              </h2>
              <p className="text-secondary text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
                {promoProduct.description || "Exclusive premium compression gear at an unbeatable price. The deal refreshes every 24 hours, don't miss out!"}
              </p>
            </div>

            {/* Countdown Grid */}
            <div className="flex justify-center lg:justify-start items-center gap-3 font-mono">
              <div className="flex flex-col items-center bg-white border border-border-light rounded-xl p-3 w-16 md:w-20 shadow-sm">
                <span className="text-xl md:text-3xl font-extrabold text-primary">{timeLeft.hours.toString().padStart(2, "0")}</span>
                <span className="text-[8px] md:text-[9px] font-bold uppercase text-muted tracking-wider mt-1">Hrs</span>
              </div>
              <span className="text-primary font-bold text-2xl">:</span>
              <div className="flex flex-col items-center bg-white border border-border-light rounded-xl p-3 w-16 md:w-20 shadow-sm">
                <span className="text-xl md:text-3xl font-extrabold text-primary">{timeLeft.minutes.toString().padStart(2, "0")}</span>
                <span className="text-[8px] md:text-[9px] font-bold uppercase text-muted tracking-wider mt-1">Min</span>
              </div>
              <span className="text-primary font-bold text-2xl">:</span>
              <div className="flex flex-col items-center bg-white border border-border-light rounded-xl p-3 w-16 md:w-20 shadow-sm">
                <span className="text-xl md:text-3xl font-extrabold text-primary">{timeLeft.seconds.toString().padStart(2, "0")}</span>
                <span className="text-[8px] md:text-[9px] font-bold uppercase text-muted tracking-wider mt-1">Sec</span>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
              <div className="flex items-baseline gap-3">
                <span className="text-lg text-muted line-through tracking-widest font-medium font-sans">
                  {formatPrice(originalPrice)}
                </span>
                <span className="text-3xl font-extrabold text-primary tracking-tight font-sans">
                  {formatPrice(promoProduct.price)}
                </span>
              </div>
              <Link href={`/products/${promoProduct.id}`} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 group">
                <span>Claim Offer</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Promo Product Image */}
          <div className="lg:col-span-5 flex justify-center">
            <Link href={`/products/${promoProduct.id}`} className="relative w-full max-w-[320px] aspect-[4/5] overflow-hidden rounded-2xl bg-white border border-border-light shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] group">
              {promoProduct.image_url && (
                <Image
                  src={promoProduct.image_url}
                  alt={promoProduct.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 30vw"
                />
              )}
              {promoProduct.video_url && (
                <video
                  src={promoProduct.video_url}
                  className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                <span className="text-white text-xs font-bold uppercase tracking-[0.2em] border-y border-white/20 py-1.5 px-4 backdrop-blur-sm">
                  View Specifications
                </span>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
