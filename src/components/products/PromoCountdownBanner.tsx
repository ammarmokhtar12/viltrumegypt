"use client";

import { Product } from "@/types";
import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";

interface PromoCountdownBannerProps {
  products: Product[];
}

export default function PromoCountdownBanner({ products }: PromoCountdownBannerProps) {
  const promoProduct = products.find(
    (p) => p.title.toUpperCase() === "LIMITED OFFER" && p.is_active
  );

  const ctaHref = promoProduct ? `/products/${promoProduct.id}` : "#bundle";

  return (
    <section className="w-full py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <Link
          href={ctaHref}
          className="block relative w-full rounded-2xl overflow-hidden shadow-xl border border-white/10 group"
        >
          <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] py-10 md:py-14 px-6 md:px-12">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c41e3a] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c41e3a] to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c41e3a]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#c41e3a]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left: Title */}
              <div className="text-center md:text-left space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c41e3a]">Bundle Offer</p>
                <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  اختار أي <span className="text-[#c41e3a]">2</span> تيشرت
                </h3>
                <p className="text-sm text-zinc-400">وفر 110 جنيه على الباندل</p>
              </div>

              {/* Center: Price */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">سعر القطعة</p>
                  <p className="text-2xl font-extrabold text-white">480 <span className="text-sm text-zinc-400">EGP</span></p>
                </div>

                <div className="w-px h-12 bg-zinc-700" />

                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c41e3a] mb-1">سعر الباندل</p>
                  <p className="text-3xl font-extrabold text-white">850 <span className="text-sm text-zinc-400">EGP</span></p>
                </div>
              </div>

              {/* Right: CTA */}
              <div className="flex items-center gap-3 bg-[#c41e3a] text-white px-6 py-3.5 rounded-xl group-hover:bg-[#d42a46] transition-colors shadow-lg shadow-[#c41e3a]/20">
                <Gift size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.15em]">Build Your Bundle</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
