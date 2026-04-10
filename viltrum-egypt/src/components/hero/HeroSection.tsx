"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    badge: "%20 Sell",
    title: "VILTRUM Performance Collection",
    description: "Premium athletic gear engineered for maximum utility and aesthetic appeal.",
    price: "EGP 599",
    image: "/products/Screenshot 2026-04-09 135734.png",
  },
  {
    id: 2,
    badge: "%10 Sell",
    title: "Elite Compression Gear",
    description: "Experience the next level of comfort and support with our compression line.",
    price: "EGP 450",
    image: "/products/Screenshot 2026-04-09 135734.png", // Reusing for concept
  },
  {
    id: 3,
    badge: "%25 Sell",
    title: "The Archive Series",
    description: "Timeless designs that define the intersection of sport and fashion.",
    price: "EGP 890",
    image: "/products/Screenshot 2026-04-09 135734.png", // Reusing for concept
  }
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % SLIDES.length);
  const prev = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <section className="relative w-full h-[85vh] md:h-[90vh] bg-[#fdfdfd] pt-24 overflow-hidden font-sans group">
      <div className="container mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="relative h-full flex items-center justify-center">
          
          {/* Slides */}
          {SLIDES.map((slide, i) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out flex flex-col items-center justify-center text-center ${
                i === current ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12 pointer-events-none"
              }`}
            >
              {/* Image Area */}
              <div className="relative w-full max-w-4xl h-[40vh] md:h-[50vh] mb-8 md:mb-12">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-contain"
                  priority={i === 0}
                />
                
                {/* Floating Content (Furnish Style) */}
                <div className="absolute top-0 left-0 text-left">
                  <span className="text-secondary italic text-lg md:text-2xl font-normal block mb-2">{slide.badge}</span>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl text-foreground font-normal leading-tight max-w-lg">
                    {slide.title}
                  </h2>
                </div>
              </div>

              {/* Bottom Content */}
              <div className="max-w-xl animate-fade-in-up">
                <p className="hidden md:block text-muted text-base mb-4 leading-relaxed">
                  {slide.description}
                </p>
                <div className="text-xl font-bold text-foreground mb-6">
                  {slide.price}
                </div>
                <Link
                  href="/products"
                  className="inline-block px-10 py-3 bg-primary text-white text-sm font-medium hover:bg-secondary transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-border-light hover:bg-primary hover:border-primary hover:text-white transition-all text-muted opacity-0 group-hover:opacity-100 hidden lg:flex"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-border-light hover:bg-primary hover:border-primary hover:text-white transition-all text-muted opacity-0 group-hover:opacity-100 hidden lg:flex"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current ? "bg-primary w-8" : "bg-border-light"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

