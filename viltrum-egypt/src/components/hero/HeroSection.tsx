"use client";

import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden font-sans">
      {/* Background Image - The T-Shirt */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/products/Screenshot 2026-04-09 135734.png"
          alt="Viltrum Hero"
          fill
          className="object-cover object-center opacity-90 scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/60" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center text-center animate-fade-in">
        {/* Edition Badge */}
        <div className="flex items-center gap-2 mb-6 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
          <span className="text-secondary text-xs">⚡</span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
            Viltrum Egypt Edition
          </span>
        </div>

        {/* Hero Titles */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-bold tracking-tighter text-black leading-none uppercase mb-2">
            VILTRUM
          </h1>
          <h2 className="text-6xl md:text-7xl font-bold tracking-tighter text-gray-400/80 leading-none uppercase">
            EGYPT
          </h2>
        </div>

        {/* Description */}
        <p className="text-base md:text-lg text-gray-600 max-w-xl leading-relaxed mb-10">
          Premium compression wear forged for warriors who demand excellence. 
          Pure performance met with uncompromising aesthetics.
        </p>

        {/* Floating Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/products"
            className="px-10 py-5 bg-[#111] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center"
          >
            Shop Collection <span className="ml-2">›</span>
          </Link>
          <Link
            href="/products"
            className="px-10 py-5 bg-white text-black text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl border border-gray-100 hover:bg-gray-50 transition-all hover:scale-105 shadow-lg flex items-center justify-center"
          >
            About Brand
          </Link>
        </div>
      </div>
    </section>
  );
}


