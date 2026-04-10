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
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      const cards = gridRef.current?.children;
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
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
      <section id="products" className="bg-background py-24 sm:py-32">
        <div className="max-w-7xl mx-auto text-center px-6">
          <h2 className="mb-4 text-3xl font-display tracking-wider text-foreground sm:text-4xl uppercase">
            Collection Coming Soon
          </h2>
          <p className="text-secondary max-w-md mx-auto text-base leading-relaxed">
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
      className="bg-background py-20 sm:py-28"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Heading */}
        <div ref={headingRef} className="mb-12 text-center sm:mb-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted block mb-3">
            Our Collection
          </span>
          <h2 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
            Premium Essentials
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-secondary">
            Premium compression wear crafted for athletes who refuse to
            compromise on form or function.
          </p>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
