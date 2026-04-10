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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50"
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
        <div className="absolute inset-0 bg-white/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/35 via-transparent to-white/20" />

        {/* Brand Watermark */}
        <div
          ref={brandRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 select-none"
        >
          <span className="text-[20vw] font-display font-bold text-black/[0.04] uppercase tracking-tighter whitespace-nowrap">
            VILTRUM
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto mt-14 flex w-full max-w-6xl flex-col items-center px-6 pb-36 pt-56 text-center sm:mt-24 sm:pb-44 sm:pt-72">
        <div
          ref={badgeRef}
          className="mb-12 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/85 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-600 backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-900" />
          Viltrum Egypt Edition
        </div>

        <h1
          ref={titleRef}
          className="text-7xl font-extrabold leading-[0.86] tracking-tighter text-zinc-900 sm:text-8xl md:text-[9rem]"
        >
          <span className="block">Viltrum.</span>
          <span className="mt-2 block text-zinc-400">Egypt.</span>
        </h1>

        <div
          ref={ctaRef}
          className="mt-24 flex w-full max-w-md flex-col justify-center gap-5 sm:max-w-none sm:flex-row"
        >
          <Link
            href="/products"
            className="btn-primary group inline-flex items-center justify-center px-10"
          >
            <span>View All Products</span>
            <ChevronRight
              size={18}
              className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
          <a href="#about" className="btn-outline inline-flex items-center justify-center px-10">
            About Viltrum
          </a>
        </div>
      </div>
    </section>
  );
}
