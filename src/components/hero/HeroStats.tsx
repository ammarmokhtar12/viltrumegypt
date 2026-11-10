"use client";

import { useEffect, useState, useRef } from "react";
import { Users, Star, ShieldCheck } from "lucide-react";

interface StatItem {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon: typeof Users;
  decimal?: boolean;
}

const statsConfig: StatItem[] = [
  {
    value: 1200,
    prefix: "+",
    label: "Happy Customers",
    icon: Users,
  },
  {
    value: 4.9,
    suffix: "★",
    label: "Average Rating",
    icon: Star,
    decimal: true,
  },
  {
    value: 98,
    suffix: "%",
    label: "Satisfaction Rate",
    icon: ShieldCheck,
  },
];

export default function HeroStats() {
  const [counts, setCounts] = useState<number[]>([0, 0, 0]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 1600; // 1.6s
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setCounts([
        Math.floor(statsConfig[0].value * easeProgress),
        parseFloat((statsConfig[1].value * easeProgress).toFixed(1)),
        Math.floor(statsConfig[2].value * easeProgress),
      ]);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCounts([statsConfig[0].value, statsConfig[1].value, statsConfig[2].value]);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 sm:mt-12 select-none">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {statsConfig.map((stat, i) => {
          const Icon = stat.icon;
          const displayVal = stat.decimal
            ? counts[i].toFixed(1)
            : counts[i].toLocaleString();

          return (
            <div
              key={stat.label}
              className="group relative flex flex-col items-center gap-1.5 sm:gap-2 px-2.5 py-3.5 sm:py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-300 hover:border-accent/40 hover:bg-black/60 hover:scale-[1.02]"
            >
              {/* Subtle hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-radial from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Icon */}
              <div className="p-1.5 rounded-lg bg-white/5 text-accent group-hover:text-red-400 group-hover:bg-accent/10 transition-colors">
                <Icon size={16} className="sm:w-4 sm:h-4" />
              </div>

              {/* Value */}
              <div className="flex items-baseline font-sans text-base sm:text-xl font-extrabold text-white tracking-tight tabular-nums">
                {stat.prefix && <span className="text-accent mr-0.5 text-xs sm:text-sm">{stat.prefix}</span>}
                <span>{displayVal}</span>
                {stat.suffix && <span className="text-accent ml-0.5 text-xs sm:text-sm">{stat.suffix}</span>}
              </div>

              {/* Label */}
              <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 text-center leading-tight">
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
