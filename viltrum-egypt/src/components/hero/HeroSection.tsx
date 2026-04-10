"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const title1Ref = useRef<HTMLHeadingElement>(null);
  const title2Ref = useRef<HTMLHeadingElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        imgRef.current,
        { scale: 1.1, opacity: 0 },
        { scale: 1, opacity: 1, duration: 2 }
      )
      .fromTo(
        title1Ref.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2 },
        "-=1.5"
      )
      .fromTo(
        title2Ref.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2 },
        "-=1.0"
      )
      .fromTo(
        ctaRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 },
        "-=0.8"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[100svh] bg-background flex flex-col justify-end pb-12 lg:pb-24 overflow-hidden"
    >
      {/* Central Immersive Image mapped to pure aesthetic */}
      <div 
        ref={imgRef}
        className="absolute inset-0 w-full h-[85vh] z-0 overflow-hidden"
      >
         {/* Standard fallback, would typically be a highly directed photoshoot image */}
         <div className="w-full h-full bg-surface" />
         <Image 
            src="/products/Screenshot 2026-04-09 135734.png"
            alt="Viltrum Campaign"
            fill
            className="object-cover object-center mix-blend-multiply opacity-90 grayscale blur-[2px] transition-all hover:blur-none"
            priority
         />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row justify-between items-end gap-12 pt-[40vh]">
         {/* Left Side Typography */}
         <div className="flex flex-col">
            <h1 className="overflow-hidden">
               <span ref={title1Ref} className="block text-6xl sm:text-8xl lg:text-[10rem] font-display font-bold leading-[0.8] tracking-tighter text-foreground uppercase">
                  VILTRUM
               </span>
            </h1>
            <h1 className="overflow-hidden">
               <span ref={title2Ref} className="block text-4xl sm:text-6xl lg:text-[7rem] font-display font-bold leading-[0.8] tracking-tighter text-foreground uppercase ml-1 lg:ml-4">
                  EGYPT
               </span>
            </h1>
         </div>

         {/* Right Side Action */}
         <div ref={ctaRef} className="flex flex-col items-start lg:items-end gap-8 max-w-sm">
            <p className="text-sm font-medium leading-relaxed text-left lg:text-right text-foreground">
               Engineering high-performance compression architectures. Pure aesthetics intersecting with absolute utility.
            </p>
            <div className="flex gap-4">
               <Link href="/products" className="btn-primary">
                  Enter Archive
               </Link>
            </div>
         </div>
      </div>
    </section>
  );
}
