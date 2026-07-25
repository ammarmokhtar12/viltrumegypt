"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const title1Ref = useRef<HTMLHeadingElement>(null);
  const title2Ref = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1.5 } });
      tl.fromTo(
        [badgeRef.current, title1Ref.current, title2Ref.current, descRef.current, buttonsRef.current],
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, delay: 0.5 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden font-sans bg-black"
      style={{ minHeight: "100svh" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
      </div>

      {/* Accent energy lines */}
      <div className="absolute top-0 left-0 right-0 h-1 accent-line z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-1 accent-line z-20" />

      {/* Dual glow orbs — red + blue */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] energy-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-blue/8 rounded-full blur-[100px] energy-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 right-1/3 w-[200px] h-[200px] bg-accent-blue/5 rounded-full blur-[80px] energy-pulse pointer-events-none" style={{ animationDelay: "2.5s" }} />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 sm:px-8 flex flex-col items-center text-center pt-32 pb-20 sm:pt-40 sm:pb-24">
        {/* Badge */}
        <div
          ref={badgeRef}
          className="flex items-center gap-2 mb-6 bg-accent/10 backdrop-blur-md text-white px-4 py-2 sm:px-5 rounded-full border border-accent/20 shadow-sm opacity-0 select-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
          <span className="type-eyebrow !text-zinc-200 text-[9px] sm:text-[10px] tracking-[0.25em]">
            Forged for the Invincible
          </span>
        </div>

        {/* Title */}
        <div className="mb-10 sm:mb-12">
          <h1
            ref={title1Ref}
            className="type-brand leading-[0.85] opacity-0 font-extrabold tracking-tight hero-glow"
            style={{
              fontSize: "clamp(4rem, 18vw, 12rem)",
              color: "#ffffff",
            }}
          >
            VILTRUM
          </h1>
          <div ref={title2Ref} className="flex items-center justify-center gap-3 sm:gap-4 opacity-0 -mt-1 sm:-mt-2">
            <div className="h-px flex-1 max-w-[60px] sm:max-w-[100px] bg-accent-blue/50" />
            <h2 className="text-xl sm:text-3xl md:text-5xl font-serif tracking-[0.2em] text-zinc-300 italic font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              Egypt
            </h2>
            <div className="h-px flex-1 max-w-[60px] sm:max-w-[100px] bg-accent-blue/50" />
          </div>
        </div>

        {/* Description */}
        <p
          ref={descRef}
          className="text-sm sm:text-base md:text-lg text-zinc-300 font-serif italic max-w-xs sm:max-w-xl leading-relaxed mb-8 sm:mb-10 opacity-0 font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          Compression armor forged for warriors who refuse to break.
          <br className="hidden sm:block" />
          Wear the power. Become the legend.
        </p>

        {/* CTA Buttons */}
        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto opacity-0 px-2 sm:px-0">
          <Link
            href="/products"
            className="btn-primary w-full sm:min-w-[200px] h-14 sm:h-auto text-[11px] sm:text-[11px] bg-accent text-white hover:bg-accent-glow border-none shadow-xl shadow-accent/25 active:scale-[0.97]"
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
