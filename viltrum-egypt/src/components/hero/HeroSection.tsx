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
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden font-sans"
      style={{ minHeight: "100svh" }}
    >
      {/* Background — uses CSS background so we can fine-tune position on every breakpoint */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/hero-bg.png')",
          backgroundSize: "cover",
          /* On mobile: shift right to centre on the key visual area of the image */
          backgroundPosition: "60% center",
        }}
      >
        {/* Responsive gradient overlay — lighter on desktop, stronger on mobile for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/20 to-white sm:from-white/55 sm:via-transparent sm:to-white" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 sm:px-8 flex flex-col items-center text-center pt-32 pb-20 sm:pt-40 sm:pb-24">
        {/* Badge */}
        <div
          ref={badgeRef}
          className="flex items-center gap-2 mb-6 bg-white/85 backdrop-blur-md text-primary px-4 py-2 sm:px-5 rounded-full border border-border-light shadow-sm opacity-0 select-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse flex-shrink-0" />
          <span className="type-eyebrow !text-foreground text-[9px] sm:text-[10px]">
            Anticipate the Grand Eid Collection Soon
          </span>
        </div>

        {/* Title */}
        <div className="mb-10 sm:mb-12">
          <h1
            ref={title1Ref}
            className="type-brand leading-[0.85] opacity-0 text-primary"
            style={{ fontSize: "clamp(4rem, 18vw, 12rem)" }}
          >
            VILTRUM
          </h1>
          <div ref={title2Ref} className="flex items-center justify-center gap-3 sm:gap-4 opacity-0 -mt-1 sm:-mt-2">
            <div className="h-px flex-1 max-w-[60px] sm:max-w-[100px] bg-black/10" />
            <h2 className="text-xl sm:text-3xl md:text-5xl font-serif tracking-[0.2em] text-accent italic font-normal">
              Egypt
            </h2>
            <div className="h-px flex-1 max-w-[60px] sm:max-w-[100px] bg-black/10" />
          </div>
        </div>

        {/* Description */}
        <p
          ref={descRef}
          className="text-sm sm:text-base md:text-lg text-secondary font-serif italic max-w-xs sm:max-w-xl leading-relaxed mb-8 sm:mb-10 opacity-0 font-normal"
        >
          Premium compression wear forged for warriors who demand excellence.
          Pure performance met with uncompromising aesthetics.
        </p>

        {/* CTA Buttons — full width on mobile, auto on desktop */}
        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto opacity-0 px-2 sm:px-0">
          <Link
            href="/products"
            className="btn-primary w-full sm:min-w-[200px] h-14 sm:h-auto text-[11px] sm:text-[11px] shadow-xl shadow-black/10 active:scale-[0.97]"
          >
            Explore Collection
          </Link>
          <Link
            href="/products"
            className="btn-secondary w-full sm:min-w-[200px] h-14 sm:h-auto text-[11px] sm:text-[11px] active:scale-[0.97]"
          >
            Our Philosophy
          </Link>
        </div>
      </div>
    </section>
  );
}
