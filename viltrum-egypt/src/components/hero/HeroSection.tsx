"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const title1Ref = useRef<HTMLHeadingElement>(null);
  const title2Ref = useRef<HTMLHeadingElement>(null);
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
    <section ref={containerRef} className="relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden font-sans">
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
      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center text-center">
        {/* Edition Badge */}
        <div ref={badgeRef} className="flex items-center gap-2 mb-6 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-100 shadow-sm opacity-0">
          <span className="text-secondary text-xs">⚡</span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
            Viltrum Egypt Edition
          </span>
        </div>

        {/* Hero Titles */}
        <div className="mb-12">
          <h1 ref={title1Ref} className="text-[15vw] md:text-[12vw] font-bebas leading-[0.8] text-black tracking-tight opacity-0">
             VILTRUM
          </h1>
          <div ref={title2Ref} className="flex items-center justify-center gap-4 opacity-0 -mt-2">
             <div className="h-[1px] flex-1 bg-black/10" />
             <h2 className="text-2xl md:text-5xl font-bebas tracking-[0.5em] text-accent">EGYPT</h2>
             <div className="h-[1px] flex-1 bg-black/10" />
          </div>
        </div>

        {/* Description */}
        <p ref={descRef} className="text-sm md:text-lg text-gray-600 max-w-xl leading-relaxed mb-10 opacity-0">
          Premium compression wear forged for warriors who demand excellence. 
          Pure performance met with uncompromising aesthetics.
        </p>

        {/* Floating Buttons */}
        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto opacity-0">
          <Link
            href="/products"
            className="btn-primary"
          >
            Explore Collection
          </Link>
          <Link
            href="/products"
            className="btn-secondary"
          >
            Our Philosophy
          </Link>
        </div>
      </div>
    </section>
  );
}



