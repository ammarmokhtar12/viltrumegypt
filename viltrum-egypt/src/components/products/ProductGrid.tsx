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
      // Heading reveal
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
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
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
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
      <section id="products" className="bg-black py-44">
        <div className="max-w-7xl mx-auto text-center px-6">
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Collection Coming Soon
          </h2>
          <p className="text-zinc-300 max-w-md mx-auto text-lg leading-relaxed">
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
      className="bg-black py-44 sm:py-56"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Heading */}
        <div ref={headingRef} className="mb-24 space-y-6 text-center sm:mb-32">
          <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-zinc-300">
            Our Collection
          </span>
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Premium Essentials
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-zinc-300">
            Premium compression wear crafted for athletes who refuse to
            compromise on form or function.
          </p>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-3 lg:gap-14"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
