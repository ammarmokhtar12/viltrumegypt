"use client";

import { useEffect, useRef } from "react";
import { ArrowDown, ChevronRight } from "lucide-react";
import gsap from "gsap";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        videoRef.current,
        { opacity: 0, scale: 1.05 },
        { opacity: 0.65, scale: 1, duration: 2.5 }
      )
        .fromTo(
          badgeRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1 },
          "-=1.5"
        )
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 40, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 1.5 },
          "-=1.2"
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20 },
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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background"
    >
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,var(--glow-color),transparent_28%)]" />

      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src="/hero-video.mp4"
          poster="/products/Screenshot 2026-04-09 135734.png"
          autoPlay
          loop
          muted
          playsInline
          className="video-mask h-full w-full object-cover opacity-0"
        />

        <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-16 pt-28 text-center sm:px-6 lg:px-8">
        <div ref={badgeRef} className="section-eyebrow mb-8 border-border-color bg-foreground/5 text-foreground/80">
          <span className="section-eyebrow-dot animate-pulse bg-viltrum-red shadow-[0_0_14px_rgba(139,0,0,0.5)]" />
          Elite Performance Essentials
        </div>

        <h1
          ref={titleRef}
          className="section-title text-[4rem] sm:text-[6rem] md:text-[7.5rem] lg:text-[9rem] font-bold tracking-tighter"
        >
          <span className="block text-foreground drop-shadow-sm">TRAIN HARD.</span>
          <span className="mt-[-0.2em] block text-gradient-blood">LOOK SHARP.</span>
        </h1>

        <p
          ref={subtitleRef}
          className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground/70 md:text-xl font-medium"
        >
          Premium compression wear crafted for athletes who want discipline in
          performance and confidence in presentation.
        </p>

        <div
          ref={ctaRef}
          className="mx-auto mt-12 flex w-full max-w-md flex-col justify-center gap-6 sm:max-w-none sm:flex-row"
        >
          <a
            href="#products"
            className="armor-btn group text-xl sm:text-2xl"
          >
            <span className="relative z-10 flex items-center gap-3">
              Shop The Drop
              <ChevronRight
                size={22}
                className="transition-transform duration-300 group-hover:translate-x-1.5"
              />
            </span>
          </a>
          <a
            href="#about"
            className="armor-ghost-btn text-xl sm:text-2xl"
          >
            Why Viltrum
          </a>
        </div>

        <div className="mt-24 grid w-full max-w-4xl grid-cols-1 gap-6 text-left sm:grid-cols-3">
          <div className="bg-card-bg backdrop-blur-md border border-border-color rounded-[32px] px-8 py-8 transition-all duration-300 hover:border-viltrum-red/30">
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/50">
              Material
            </p>
            <p className="mt-2 text-xl font-bold text-foreground">
              Sculpted compression fit
            </p>
          </div>
          <div className="bg-card-bg backdrop-blur-md border border-border-color rounded-[32px] px-8 py-8 transition-all duration-300 hover:border-viltrum-red/30">
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/50">
              Presence
            </p>
            <p className="mt-2 text-xl font-bold text-foreground">
              Premium silhouette
            </p>
          </div>
          <div className="bg-card-bg backdrop-blur-md border border-border-color rounded-[32px] px-8 py-8 transition-all duration-300 hover:border-viltrum-red/30">
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/50">
              Finish
            </p>
            <p className="mt-2 text-xl font-bold text-foreground">
              Sharp details
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 animate-bounce">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/40">
          Scroll
        </span>
        <ArrowDown size={16} className="text-foreground/40" />
      </div>
    </section>
  );
}
