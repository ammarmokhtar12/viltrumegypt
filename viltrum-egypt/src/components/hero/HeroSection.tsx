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

      // Fade in background video
      tl.fromTo(
        videoRef.current,
        { opacity: 0, scale: 1.05 },
        { opacity: 0.65, scale: 1, duration: 2.5 }
      )
        // Reveal badge
        .fromTo(
          badgeRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1 },
          "-=1.5"
        )
        // Reveal title
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 40, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 1.5 },
          "-=1.2"
        )
        // Reveal subtitle
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 1 },
          "-=1.0"
        )
        // Reveal CTA
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-viltrum-black"
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-black pointer-events-none">
        <video
          ref={videoRef}
          src="/hero-video.mp4"
          poster="/products/Screenshot 2026-04-09 135734.png" // Fallback to user's uploaded image if video is missing
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover video-mask opacity-0"
        />
        
        {/* Gradients to seamlessly blend the video edges into the #0A0A0A background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-[#0A0A0A] opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-[#0A0A0A] opacity-60" />
      </div>

      {/* Content Container - Centered Overlay Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex flex-col items-center text-center">
        
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-viltrum-red/30 bg-black/40 backdrop-blur-md text-viltrum-red text-xs tracking-[0.35em] font-semibold uppercase mb-8 shadow-[0_0_20px_rgba(178,0,0,0.15)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-viltrum-red animate-pulse" />
          Premium Athletic Wear
        </div>

        {/* Text Overlay with Drop Shadow & Blend Mode */}
        <h1
          ref={titleRef}
          className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black leading-[0.85] tracking-[-0.02em]"
          style={{ textShadow: "0 20px 50px rgba(0,0,0,0.7), 0 0 20px rgba(178,0,0,0.2)" }}
        >
          <span className="text-viltrum-white block">VILTRUM</span>
          <span className="text-gradient-blood block mt-2">EGYPT</span>
        </h1>

        <p
          ref={subtitleRef}
          className="text-base md:text-xl text-viltrum-white/90 max-w-2xl mx-auto mt-8 leading-relaxed font-light drop-shadow-lg"
          style={{ textShadow: "0 4px 10px rgba(0,0,0,0.8)" }}
        >
          Forged in strength. Built for warriors who demand peak performance. 
          Our compression shirts are engineered with Viltrumite-grade precision.
        </p>

        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-5 justify-center mt-12">
          <a
            href="#products"
            className="armor-btn group inline-flex items-center justify-center gap-3 px-12 py-5 font-bold text-sm tracking-[0.2em] uppercase"
          >
            <span className="relative z-10 flex items-center gap-2">
              CLAIM YOUR ARMOR
              <ChevronRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </span>
          </a>
          <a
            href="#products"
            className="armor-ghost-btn inline-flex items-center justify-center px-12 py-5 font-semibold text-sm tracking-[0.2em] uppercase backdrop-blur-md"
          >
            View Collection
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce z-10">
        <span className="text-[10px] tracking-[0.4em] text-viltrum-white/50 uppercase font-bold drop-shadow-md">
          Scroll
        </span>
        <ArrowDown size={16} className="text-viltrum-white/50 drop-shadow-md" />
      </div>
    </section>
  );
}
