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
  const brandScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        videoRef.current,
        { opacity: 0, scale: 1.05 },
        { opacity: 0.9, scale: 1, duration: 2.5 }
      )
        .fromTo(
          brandScrollRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 2, ease: "expo.out" },
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
          { opacity: 0, y: 40, scale: 0.98 },
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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white"
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src="/hero-video.mp4"
          poster="/products/Screenshot 2026-04-09 135734.png"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-0 opacity-90"
          style={{ mixBlendMode: 'multiply' }}
        />
        <div className="absolute inset-0 bg-white/40" />
        
        {/* Brand Overlay Text */}
        <div 
          ref={brandScrollRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 select-none"
        >
          <span className="text-[22vw] font-display font-black text-zinc-900/[0.03] uppercase tracking-tighter whitespace-nowrap">
            Viltrum Egypt
          </span>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-16 pt-28 text-center sm:px-6 lg:px-8">
        <div ref={badgeRef} className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-full text-xs font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
          Elite Performance Essentials
        </div>

        <h1
          ref={titleRef}
          className="font-display text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] font-bold tracking-tighter leading-[0.85] text-zinc-900"
        >
          <span className="block">TRAIN HARD.</span>
          <span className="block text-zinc-400">LOOK SHARP.</span>
        </h1>

        <p
          ref={subtitleRef}
          className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-600 md:text-xl font-medium"
        >
          Premium compression wear crafted for athletes who want discipline in
          performance and confidence in presentation.
        </p>

        <div
          ref={ctaRef}
          className="mx-auto mt-12 flex w-full max-w-md flex-col justify-center gap-4 sm:max-w-none sm:flex-row"
        >
          <a href="#products" className="btn-primary group">
            <span>Shop The Drop</span>
            <ChevronRight size={18} className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <a href="#about" className="btn-outline">
            Why Viltrum
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 animate-bounce">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">
          Scroll
        </span>
        <ArrowDown size={16} className="text-zinc-400" />
      </div>
    </section>
  );
}
