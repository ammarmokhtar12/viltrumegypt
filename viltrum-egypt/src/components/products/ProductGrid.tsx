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
          { opacity: 0, y: 80, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.12,
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
      <section id="products" className="section-padding">
        <div className="max-w-7xl mx-auto text-center py-24">
          <div className="w-24 h-24 rounded-full bg-viltrum-red/8 flex items-center justify-center mx-auto mb-8 red-glow">
            <span className="text-viltrum-red text-4xl font-display font-black">V</span>
          </div>
          <h2 className="text-3xl font-display font-black text-viltrum-white mb-4 tracking-tight">
            Collection Coming Soon
          </h2>
          <p className="text-viltrum-mist/40 max-w-md mx-auto text-sm leading-relaxed">
            Our warriors are forging the next collection. Stay tuned for legendary drops.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="products"
      className={`section-padding ${isMobile ? "" : "noise-bg"}`}
      style={{ background: "linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 50%, #0A0A0A 100%)" }}
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Divider line */}
        <div
          ref={lineRef}
          className="h-[1px] bg-gradient-to-r from-transparent via-viltrum-mist/10 to-transparent mb-24 origin-center"
        />

        {/* Section Heading */}
        <div ref={headingRef} className="text-center mb-24 md:mb-32 space-y-6">
          <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-viltrum-mist/10 bg-white/5 text-viltrum-white text-xs tracking-[0.4em] font-medium uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-viltrum-white/60" />
            The Collection
          </span>

          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-black text-viltrum-white tracking-tighter leading-[0.95]">
            BUILT FOR{" "}
            <span className="text-gradient-blood">WARRIORS</span>
          </h2>

          <p className="text-viltrum-mist max-w-lg mx-auto text-base leading-relaxed mt-8">
            Each piece is precision-engineered for peak performance, 
            unmatched comfort, and a look that commands respect.
          </p>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 md:gap-8"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
