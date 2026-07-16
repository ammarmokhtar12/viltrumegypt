"use client";

import { Product } from "@/types";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    <section className="w-full py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Banner image — plain img tag for maximum compatibility */}
        <Link
          href={ctaHref}
          className="block relative w-full rounded-2xl overflow-hidden shadow-xl border border-border-light group"
          style={{ display: "block" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bundle-offer-banner.png"
            alt="Bundle Offer – 2 T-Shirts 850 EGP | 3 T-Shirts 1200 EGP"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Link>

        {/* Pricing pills below image */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-3 bg-surface border border-border-light rounded-2xl px-6 py-4 shadow-sm">
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted mb-0.5">2 T-Shirts Bundle</p>
              <p className="text-2xl font-extrabold text-primary leading-none">850 <span className="text-sm font-semibold text-secondary">EGP</span></p>
            </div>
          </div>

          <div className="hidden sm:block text-muted text-xl font-light">|</div>

          <div className="flex items-center gap-3 bg-primary text-white rounded-2xl px-6 py-4 shadow-lg">
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
