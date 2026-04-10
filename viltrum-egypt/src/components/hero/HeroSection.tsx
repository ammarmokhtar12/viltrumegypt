"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import gsap from "gsap";
import Link from "next/link";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        imageRef.current,
        { opacity: 0, x: 30, scale: 0.98 },
        { opacity: 1, x: 0, scale: 1, duration: 1.4 }
      )
        .fromTo(
          badgeRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1 },
          "-=1"
        )
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 50, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 1.5 },
          "-=1.2"
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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black"
    >
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-36 md:grid-cols-2 md:gap-16 lg:py-44">
        <div className="space-y-10">
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/70 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-300"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Viltrum Egypt Edition
          </div>

          <h1
            ref={titleRef}
            className="text-6xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-7xl lg:text-8xl"
          >
            <span className="block">Viltrum.</span>
            <span className="mt-3 block text-zinc-300">Egypt.</span>
          </h1>

          <div
            ref={ctaRef}
            className="flex w-full max-w-xl flex-col gap-4 sm:flex-row"
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

        <div ref={imageRef} className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-3 md:max-w-lg">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
            <Image
              src="/products/Screenshot 2026-04-09 135734.png"
              alt="Viltrum premium compression shirt"
              fill
              priority
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
