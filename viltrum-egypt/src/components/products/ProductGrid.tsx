"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProductCard from "./ProductCard";
import { Product } from "@/types";

gsap.registerPlugin(ScrollTrigger);

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Line reveal
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.2,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: lineRef.current,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Heading reveal
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // Cards stagger reveal
      const cards = gridRef.current?.children;
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [products]);

  if (products.length === 0) {
    return (
      <section id="products" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="mb-4 font-display text-[3rem] leading-none tracking-wide text-zinc-900">
            Collection Coming Soon
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
            We are preparing the next drop. Stay tuned.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="products"
      className="py-32 bg-white"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Divider line */}
        <div
          ref={lineRef}
          className="h-[1px] bg-zinc-200 mb-24 origin-center"
        />

        {/* Section Heading */}
        <div ref={headingRef} className="text-center mb-24 md:mb-32 space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-full text-xs font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            Signature Selection
          </span>

          <h2 className="font-display text-[4rem] md:text-[6rem] lg:text-[8rem] leading-[0.85] text-zinc-900 tracking-tighter">
            Made For <span className="text-zinc-400">Presence</span>
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-zinc-500 md:text-lg">
            A tighter edit of premium essentials designed to hold shape,
            elevate silhouette, and make every training look feel more
            intentional.
          </p>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
