"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      const cards = gridRef.current?.children;
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power4.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 75%",
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
      <section id="products" className="bg-background py-32 lg:py-56">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-4xl lg:text-7xl font-display font-bold uppercase tracking-tighter text-foreground mb-8">
            ARCHIVE INACTIVE
          </h2>
          <p className="text-sm font-bold uppercase tracking-widest text-muted">
            The collection is currently sealed.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="products"
      className="bg-background py-32 lg:py-56 border-t border-border-light"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section Heading */}
        <div ref={headingRef} className="mb-24 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
          <div className="flex flex-col">
             <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted block mb-6">
               Index 01
             </span>
             <h2 className="text-5xl sm:text-7xl lg:text-9xl font-bold font-display uppercase leading-[0.8] tracking-tighter text-foreground">
               ESSENTIALS
             </h2>
          </div>
          <div className="max-w-xs">
             <p className="text-sm font-medium leading-relaxed text-secondary text-left lg:text-justify">
               Uncompromising construction. Essential forms engineered for high output and extreme endurance.
             </p>
          </div>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-24"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
