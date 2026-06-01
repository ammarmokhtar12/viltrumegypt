"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import Image from "next/image";

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
      className="relative w-full min-h-screen min-h-[700px] flex items-center justify-center overflow-hidden font-sans"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src="/products/hero-original.png"
          alt="Viltrum Hero"
          fill
          className="object-cover object-center opacity-90 scale-105"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center text-center pt-32 pb-20">
        <div
          ref={badgeRef}
          className="flex items-center gap-2 mb-6 bg-white/80 backdrop-blur-sm text-primary px-5 py-2 rounded-full border border-border-light shadow-sm opacity-0 select-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
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
            <div className="h-px flex-1 max-w-[100px] bg-black/10" />
            <h2 className="text-2xl md:text-5xl font-serif tracking-[0.2em] text-accent italic font-normal">
              Egypt
            </h2>
            <div className="h-px flex-1 max-w-[100px] bg-black/10" />
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
