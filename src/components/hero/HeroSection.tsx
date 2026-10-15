"use client";

import Link from "next/link";
import TextReveal from "@/components/ui/TextReveal";
import MagneticButton from "@/components/ui/MagneticButton";
import GothamAtmosphere from "@/components/hero/GothamAtmosphere";
import BatLogo from "@/components/ui/BatLogo";

export default function HeroSection() {
  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden font-sans"
      style={{ minHeight: "100svh" }}
    >
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-bg.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero-purple.mov" type="video/mp4" />
          <source src="/videos/hero-purple.mov" type="video/quicktime" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
      </div>

      {/* Gotham City Noir Atmosphere (Bat-Signal, Rain, Fog, Lightning) */}
      <GothamAtmosphere />

      {/* Accent energy lines */}
      <div className="absolute top-0 left-0 right-0 h-1 accent-line z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-1 accent-line z-20" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 flex flex-col items-center text-center pt-32 pb-20 sm:pt-40 sm:pb-24">
        {/* Badge */}
        <div
          className="hero-fade-in flex items-center gap-2.5 mb-8 sm:mb-10 bg-black/60 backdrop-blur-md text-white px-4 py-2 sm:px-5 rounded-full border border-amber-500/25 shadow-[0_0_15px_rgba(245,180,50,0.15)] select-none"
          style={{ animationDelay: "0.3s" }}
        >
          <BatLogo className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          <span className="type-eyebrow !text-zinc-200 text-[9px] sm:text-[10px] tracking-[0.25em]">
            THE DARK KNIGHT ARCHIVE • GOTHAM PROTOCOL
          </span>
        </div>

        {/* Headline */}
        <TextReveal delay={0.6}>
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            EVERY HERO
          </h1>
        </TextReveal>
        
        <TextReveal delay={0.9} className="mb-8 sm:mb-10">
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            <span className="invincible-text">NEEDS A </span><span className="invincible-text-accent">SUIT.</span>
          </h1>
        </TextReveal>

        {/* Description */}
        <p
          className="hero-fade-in text-sm sm:text-base md:text-lg text-zinc-300 font-sans max-w-xs sm:max-w-xl leading-relaxed mb-8 sm:mb-10 font-medium tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          style={{ animationDelay: "1.2s" }}
        >
          Tactical compression armor engineered for those who conquer the darkness.
        </p>

        {/* CTA Buttons */}
        <div
          className="hero-fade-in flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-2 sm:px-0"
          style={{ animationDelay: "1.4s" }}
        >
          <MagneticButton>
            <Link
              href="/products"
              className="rgb-btn w-full sm:min-w-[200px] h-14 sm:h-auto text-[11px] sm:text-[11px] text-white border-none shadow-xl shadow-accent/25 active:scale-[0.97] inline-flex items-center justify-center font-sans px-8 py-3.5 font-semibold uppercase tracking-[0.2em] rounded-xl transition-all"
            >
              Enter The Archive
            </Link>
          </MagneticButton>
          <MagneticButton>
            <a
              href="#bundle"
              className="btn-secondary w-full sm:min-w-[200px] h-14 sm:h-auto text-[11px] sm:text-[11px] bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm active:scale-[0.97]"
            >
              Build Your Bundle
            </a>
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
