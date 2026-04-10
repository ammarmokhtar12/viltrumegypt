"use client";

import { useEffect, useRef } from "react";
import { ChevronRight, Zap } from "lucide-react";
import gsap from "gsap";
import Link from "next/link";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        videoRef.current,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 2 }
      )
        .fromTo(
          badgeRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=1.2"
        )
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1.2 },
          "-=0.8"
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.6"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.5"
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-background"
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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
        {/* Overlays for text readability */}
        <div className="absolute inset-0 bg-background/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/20 to-background/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-32 text-center sm:py-40">
        <div
          ref={badgeRef}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border-light bg-surface/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-secondary backdrop-blur-md"
        >
          <Zap size={12} className="text-accent" />
          Viltrum Egypt Edition
        </div>

        <h1
          ref={titleRef}
          className="font-display text-[clamp(3rem,10vw,7rem)] leading-[0.95] tracking-wider text-foreground uppercase"
        >
          <span className="block">Viltrum</span>
          <span className="block text-[0.55em] text-muted mt-1">Egypt</span>
        </h1>

        <p
          ref={subtitleRef}
          className="mt-6 max-w-md text-base sm:text-lg text-secondary leading-relaxed"
        >
          Premium compression wear forged for warriors who demand excellence.
        </p>

        <div
          ref={ctaRef}
          className="mt-10 flex w-full max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4"
        >
          <Link
            href="/products"
            className="btn-primary group inline-flex items-center justify-center px-8"
          >
            <span>Shop Collection</span>
            <ChevronRight
              size={16}
              className="ml-1.5 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
          <a href="#about" className="btn-outline inline-flex items-center justify-center px-8">
            About Brand
          </a>
        </div>
      </div>
    </section>
  );
}
