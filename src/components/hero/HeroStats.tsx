"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface StatItem {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon: React.ReactNode;
}

const stats: StatItem[] = [
  {
    value: 1200,
    prefix: "+",
    label: "Happy Customers",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    value: 4.9,
    suffix: "★",
    label: "Average Rating",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    value: 98,
    suffix: "%",
    label: "Satisfaction Rate",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },

];

export default function HeroStats() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      // Animate the container in
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          delay: 1.8,
        }
      );

      // Animate each stat number counting up
      const statNumbers = containerRef.current.querySelectorAll<HTMLElement>("[data-count]");
      statNumbers.forEach((el, i) => {
        const target = parseFloat(el.dataset.count || "0");
        const isDecimal = target % 1 !== 0;
        const obj = { val: 0 };

        gsap.to(obj, {
          val: target,
          duration: 2,
          delay: 2 + i * 0.15,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = isDecimal
              ? obj.val.toFixed(1)
              : Math.floor(obj.val).toLocaleString();
          },
        });
      });

      // Stagger the individual stat items
      const items = containerRef.current.querySelectorAll(".hero-stat-item");
      gsap.fromTo(
        items,
        { opacity: 0, y: 20, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          delay: 1.9,
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="w-full max-w-3xl mx-auto mt-8 sm:mt-12 opacity-0"
    >
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="hero-stat-item group relative flex flex-col items-center gap-1.5 sm:gap-2 px-3 py-4 sm:py-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.15] hover:scale-[1.03]"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(196, 30, 58, 0.08), transparent 70%)",
              }}
            />

            {/* Icon */}
            <div className="text-accent/80 group-hover:text-accent transition-colors duration-300">
              {stat.icon}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-0.5">
              {stat.prefix && (
                <span className="text-accent text-sm sm:text-base font-bold font-sans">
                  {stat.prefix}
                </span>
              )}
              <span
                data-count={stat.value}
                className="text-xl sm:text-2xl font-extrabold text-white font-sans tabular-nums tracking-tight"
              >
                0
              </span>
              {stat.suffix && (
                <span className="text-accent text-sm sm:text-base font-bold font-sans ml-0.5">
                  {stat.suffix}
                </span>
              )}
            </div>

            {/* Label */}
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 text-center leading-tight">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
