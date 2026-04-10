"use client";

import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import gsap from "gsap";
import Link from "next/link";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        videoRef.current,
        { opacity: 0, scale: 1.08 },
        { opacity: 0.9, scale: 1, duration: 2.5 }
      )
        .fromTo(
          brandRef.current,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 2.2, ease: "expo.out" },
          "-=2"
        )
        .fromTo(
          badgeRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1 },
          "-=1.5"
        )
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 50, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 1.5 },
          "-=1.2"
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1 },
          "-=1.0"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.8"
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white"
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src="/hero-video.mp4"
          poster="/products/Screenshot 2026-04-09 135734.png"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-0"
        />
        <div className="absolute inset-0 bg-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />

        {/* Brand Watermark */}
        <div
          ref={brandRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 select-none"
        >
          <span className="text-[20vw] font-display font-bold text-white/[0.02] uppercase tracking-tighter whitespace-nowrap">
            VILTRUM
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-20 pt-48 sm:pt-64 text-center mt-12 sm:mt-24">
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 mb-10 px-5 py-2bg-white/5 backdrop-blur-sm border border-white/10 text-zinc-300 rounded-full text-[11px] font-bold uppercase tracking-[0.35em] shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Viltrum Egypt Edition
        </div>

        <h1
          ref={titleRef}
          className="font-display text-6xl sm:text-8xl md:text-9xl font-bold tracking-tighter leading-[0.85] text-white"
        >
          <span className="block drop-shadow-2xl">Viltrum.</span>
          <span className="block text-zinc-400 mt-2 drop-shadow-xl">Egypt.</span>
        </h1>

        <p
          ref={subtitleRef}
          className="mt-12 max-w-xl text-lg sm:text-xl leading-relaxed text-zinc-300 font-medium tracking-tight"
        >
          The ultimate compression performancewear. Forged in strength, 
          designed for the elite. Experience the Viltrum revolution.
        </p>

        <div
          ref={ctaRef}
          className="mt-14 flex flex-col sm:flex-row gap-4 w-full max-w-md sm:max-w-none justify-center"
        >
          <Link
            href="/products"
            className="btn-primary group inline-flex items-center justify-center"
          >
            <span>View All Products</span>
            <ChevronRight
              size={18}
              className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
          <a href="#about" className="btn-outline inline-flex items-center justify-center">
            About Viltrum
          </a>
        </div>
      </div>
    </section>
  );
}
