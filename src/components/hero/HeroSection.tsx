"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden font-sans"
      style={{ minHeight: "100svh" }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
      </div>

      {/* Accent energy lines */}
      <div className="absolute top-0 left-0 right-0 h-1 accent-line z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-1 accent-line z-20" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 flex flex-col items-center text-center pt-32 pb-20 sm:pt-40 sm:pb-24">
        {/* Badge */}
        <div
          className="hero-fade-in flex items-center gap-2 mb-8 sm:mb-10 bg-black/40 backdrop-blur-md text-white px-4 py-2 sm:px-5 rounded-full border border-white/10 shadow-sm select-none"
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
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            WEAR THE POWER.
          </h1>
        </div>
        <div
          className="hero-fade-in-up mb-8 sm:mb-10"
          style={{ animationDelay: "0.9s" }}
        >
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            BECOME THE <span className="text-accent">LEGEND.</span>
          </h1>
        </div>

        {/* Description */}
        <p
          className="hero-fade-in text-sm sm:text-base md:text-lg text-zinc-300 font-sans max-w-xs sm:max-w-lg leading-relaxed mb-8 sm:mb-10 font-medium tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
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
          <a
            href="#bundle"
            className="btn-secondary w-full sm:min-w-[200px] h-14 sm:h-auto text-[11px] sm:text-[11px] bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm active:scale-[0.97]"
          >
            Build Your Bundle
          </a>
        </div>
      </div>
    </section>
  );
}
