"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ViltrumLoader() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const removeTimer = setTimeout(() => setShow(false), 2600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-600 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-8">

        {/* Logo Container with spinning rings */}
        <div className="relative flex items-center justify-center w-44 h-44">

          {/* Outer glowing ring — slow spin */}
          <div
            className="absolute inset-0 rounded-full border-2 border-[#1a1a1a]/10 animate-spin"
            style={{ animationDuration: "6s" }}
          />

          {/* Middle ring — counter-spin */}
          <div
            className="absolute inset-3 rounded-full border border-[#1a1a1a]/5 animate-spin"
            style={{ animationDuration: "4s", animationDirection: "reverse" }}
          />

          {/* Pulse ring behind logo */}
          <div className="absolute inset-6 rounded-full bg-[#1a1a1a]/5 viltrum-pulse-ring" />

          {/* The actual logo — spinning */}
          <div className="relative w-28 h-28 viltrum-logo-spin">
            <Image
              src="/viltrum-logo.png"
              alt="Viltrum Egypt"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Orbiting dot */}
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "3s" }}
          >
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a1a] rounded-full shadow-[0_0_8px_rgba(26,26,26,0.2)]" />
          </div>

          {/* Orbiting dot 2 — reverse */}
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "4.5s", animationDirection: "reverse" }}
          >
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#1a1a1a]/30 rounded-full" />
          </div>
        </div>

        {/* Brand text */}
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="text-[#1a1a1a] text-3xl tracking-[0.25em] font-bold select-none"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            VILTRUM EGYPT
          </span>
          <span className="text-[#1a1a1a]/50 text-[9px] font-bold tracking-[0.6em] uppercase">
            Forged in Strength
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-56 h-[2px] bg-[#1a1a1a]/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#1a1a1a] rounded-full viltrum-progress-bar" />
        </div>
      </div>
    </div>
  );
}
