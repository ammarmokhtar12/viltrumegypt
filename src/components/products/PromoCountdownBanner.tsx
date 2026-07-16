"use client";

import { Product } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gift } from "lucide-react";

interface PromoCountdownBannerProps {
  products: Product[];
}

export default function PromoCountdownBanner({ products }: PromoCountdownBannerProps) {
  // Find the product named "LIMITED OFFER" (case-insensitive) for the CTA link
  const promoProduct = products.find(
    (p) => p.title.toUpperCase() === "LIMITED OFFER" && p.is_active
  );

  const ctaHref = promoProduct ? `/products/${promoProduct.id}` : "#";

  return (
    <section className="w-full py-8 md:py-12 relative overflow-hidden">
      {/* Background subtle glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
        {/* Section label */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-px flex-1 bg-border-light max-w-[80px]" />
          <span className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full text-primary font-sans text-[10px] font-bold uppercase tracking-[0.25em]">
            <Gift size={11} />
            Bundle Offer
          </span>
          <div className="h-px flex-1 bg-border-light max-w-[80px]" />
        </div>

        {/* Banner image */}
        <Link
          href={ctaHref}
          className="block relative w-full rounded-2xl overflow-hidden shadow-xl border border-border-light group transition-all duration-500 hover:shadow-2xl hover:scale-[1.005]"
        >
          <Image
            src="/bundle-offer-banner.png"
            alt="Bundle Offer – 2 T-Shirts 850 EGP | 3 T-Shirts 1200 EGP"
            width={1920}
            height={720}
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            priority
          />

          {/* Hover overlay CTA */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2 bg-white text-primary text-xs font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-full shadow-xl">
              Build Your Bundle <ArrowRight size={14} />
            </span>
          </div>
        </Link>

        {/* Pricing pills below image */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-3 bg-surface border border-border-light rounded-2xl px-6 py-4 shadow-sm">
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted mb-0.5">2 T-Shirts Bundle</p>
              <p className="text-2xl font-extrabold text-primary leading-none">850 <span className="text-sm font-semibold text-secondary">EGP</span></p>
            </div>
          </div>

          <div className="hidden sm:flex items-center text-muted text-xl font-light">|</div>

          <div className="flex items-center gap-3 bg-primary text-white rounded-2xl px-6 py-4 shadow-lg shadow-primary/20">
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 mb-0.5">3 T-Shirts Bundle</p>
              <p className="text-2xl font-extrabold leading-none">1,200 <span className="text-sm font-semibold text-white/80">EGP</span></p>
            </div>
          </div>

          <Link
            href={ctaHref}
            className="btn-primary flex items-center gap-2 group whitespace-nowrap"
          >
            <span>Build Your Bundle</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
