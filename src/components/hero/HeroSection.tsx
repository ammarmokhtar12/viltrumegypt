"use client";

import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans bg-black"
      style={{ minHeight: "100svh" }}
    >
      {/* Background — dark with subtle texture */}
      <div className="absolute inset-0 z-0 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(196,30,58,0.06)_0%,transparent_70%)]" />
      </div>

      {/* Accent energy lines */}
      <div className="absolute top-0 left-0 right-0 h-1 accent-line z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-1 accent-line z-20" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] energy-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-blue/8 rounded-full blur-[100px] energy-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 flex flex-col items-center text-center pt-28 pb-16 sm:pt-40 sm:pb-24">
        {/* Badge */}
        <div
          className="hero-fade-in flex items-center gap-2 mb-6 sm:mb-8 bg-accent/10 backdrop-blur-md text-white px-4 py-2 sm:px-5 rounded-full border border-accent/20 shadow-sm select-none rgb-border"
          style={{ animationDelay: "0.3s" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
          <span className="type-eyebrow !text-zinc-200 text-[9px] sm:text-[10px] tracking-[0.25em]">
            Forged for the Invincible
          </span>
        </div>

        {/* Headline */}
        <div
          className="hero-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          <h1 className="text-[clamp(2.2rem,7vw,5.5rem)] font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
            WEAR THE POWER.
          </h1>
        </div>
        <div
          className="hero-fade-in-up mb-6 sm:mb-8"
          style={{ animationDelay: "0.9s" }}
        >
          <h1 className="text-[clamp(2.2rem,7vw,5.5rem)] font-extrabold leading-[1.05] tracking-tight rgb-glow-text drop-shadow-[0_4px_30px_rgba(196,30,58,0.3)]">
            BECOME THE LEGEND.
          </h1>
        </div>

        {/* Hero Banner Image — full width showcase */}
        <div
          className="hero-fade-in w-[calc(100%+40px)] sm:w-full max-w-3xl mx-auto mb-6 sm:mb-8 relative -mx-5 sm:mx-auto"
          style={{ animationDelay: "1.0s" }}
        >
          <div className="relative w-full rounded-none sm:rounded-2xl overflow-hidden border-y sm:border border-white/10 shadow-2xl shadow-black/50">
            <Image
              src="/hero-bg.png"
              alt="Viltrum hero collection icons"
              width={1456}
              height={816}
              className="w-full h-auto"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
          </div>
        </div>

        {/* Description */}
        <p
          className="hero-fade-in text-sm sm:text-base md:text-lg text-zinc-400 font-sans max-w-xs sm:max-w-lg leading-relaxed mb-6 sm:mb-8 font-medium tracking-wide"
          style={{ animationDelay: "1.2s" }}
        >
          Compression armor engineered for warriors who refuse to break.
        </p>

        {/* CTA Buttons */}
        <div
          className="hero-fade-in flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-2 sm:px-0"
          style={{ animationDelay: "1.4s" }}
        >
          <Link
            href="/products"
            className="rgb-btn w-full sm:min-w-[200px] h-14 sm:h-auto text-[11px] sm:text-[11px] text-white border-none shadow-xl shadow-accent/25 active:scale-[0.97] inline-flex items-center justify-center font-sans px-8 py-3.5 font-semibold uppercase tracking-[0.2em] rounded-xl transition-all"
          >
            Enter The Archive
          </Link>
          <Link
            href="/products"
            className="btn-secondary w-full sm:min-w-[200px] h-14 sm:h-auto text-[11px] sm:text-[11px] bg-accent-blue/20 hover:bg-accent-blue/30 text-white border-accent-blue/30 backdrop-blur-sm active:scale-[0.97]"
          >
            Build Your Bundle
          </Link>
        </div>
      </div>
    </section>
  );
}
