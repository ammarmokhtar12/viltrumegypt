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
        <div className="relative flex items-center justify-center w-44 h-44">
          <div
            className="absolute inset-0 rounded-full border-2 border-primary/10 animate-spin"
            style={{ animationDuration: "6s" }}
          />
          <div
            className="absolute inset-3 rounded-full border border-primary/5 animate-spin"
            style={{ animationDuration: "4s", animationDirection: "reverse" }}
          />
          <div className="absolute inset-6 rounded-full bg-primary/5 viltrum-pulse-ring" />

          <div className="relative w-28 h-28 viltrum-logo-spin">
            <Image
              src="/viltrum-logo.png"
              alt="Viltrum Egypt"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "3s" }}
          >
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(26,26,26,0.15)]" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="type-brand text-3xl tracking-[0.2em] select-none">
            VILTRUM EGYPT
          </span>
          <span className="type-eyebrow !text-muted">
            Forged in Strength
          </span>
        </div>

        <div className="w-56 h-[2px] bg-primary/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full viltrum-progress-bar" />
        </div>
      </div>
    </div>
  );
}
