"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-background"
    >
      <div className="absolute inset-0 z-0">
        {/* Soft base — white/gray brand */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-background to-background" />

        {/* Subtle motion (not a full product poster) */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover object-center scale-110 opacity-[0.22] blur-[2px] motion-reduce:hidden"
          aria-hidden
        >
          <source src="/products/white-shirt.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/88 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,rgba(247,247,248,0.9)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center text-center pt-32 pb-20">
        <div
          ref={badgeRef}
          className="flex items-center gap-2 mb-6 bg-white/90 backdrop-blur-md text-primary px-5 py-2 rounded-full border border-border-light shadow-sm opacity-0 select-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="type-eyebrow !text-foreground">
            Anticipate the Grand Eid Collection Soon
          </span>
        </div>

        <div className="mb-12">
          <h1
            ref={title1Ref}
            className="text-[15vw] md:text-[12vw] type-brand leading-[0.85] opacity-0 text-primary"
          >
            VILTRUM
          </h1>
          <div ref={title2Ref} className="flex items-center justify-center gap-4 opacity-0 -mt-2">
            <div className="h-px flex-1 max-w-[100px] bg-border-light" />
            <h2 className="text-2xl md:text-5xl font-serif tracking-[0.2em] text-accent italic font-normal">
              Egypt
            </h2>
            <div className="h-px flex-1 max-w-[100px] bg-border-light" />
          </div>
        </div>

        <p
          ref={descRef}
          className="text-sm md:text-lg text-secondary font-serif italic max-w-xl leading-relaxed mb-10 opacity-0 font-normal"
        >
          Premium compression wear forged for warriors who demand excellence.
          Pure performance met with uncompromising aesthetics.
        </p>

        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto opacity-0">
          <Link href="/products" className="btn-primary min-w-[200px]">
            Explore Collection
          </Link>
          <Link href="/products" className="btn-secondary min-w-[200px]">
            Our Philosophy
          </Link>
        </div>
      </div>
    </section>
  );
}
