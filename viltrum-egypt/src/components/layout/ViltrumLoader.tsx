"use client";

import { useEffect, useState } from "react";

export default function ViltrumLoader() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 1.8 seconds
    const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
    // Fully remove after 2.3 seconds (1.8s + 0.5s fade)
    const removeTimer = setTimeout(() => setShow(false), 2300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Spinning Superhero / Viltrum Logo */}
        <div className="relative w-28 h-28">
          {/* Outer Ring - rotating */}
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent animate-spin"
            style={{
              borderTopColor: "#000",
              borderRightColor: "rgba(0,0,0,0.15)",
              borderBottomColor: "rgba(0,0,0,0.05)",
              animationDuration: "1.2s",
            }}
          />

          {/* Middle Ring - counter-rotating */}
          <div
            className="absolute inset-3 rounded-full border-[2px] border-transparent animate-spin"
            style={{
              borderTopColor: "rgba(0,0,0,0.4)",
              borderLeftColor: "rgba(0,0,0,0.1)",
              animationDuration: "0.9s",
              animationDirection: "reverse",
            }}
          />

          {/* Inner pulsing emblem */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Pulsing glow ring */}
              <div
                className="absolute -inset-4 rounded-full bg-black/5 animate-pulse"
                style={{ animationDuration: "1.5s" }}
              />
              {/* The "V" emblem */}
              <div className="w-14 h-14 bg-primary text-background flex items-center justify-center rounded-xl shadow-2xl shadow-black/20 relative overflow-hidden">
                {/* Shine effect */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"
                  style={{ animationDuration: "2s" }}
                />
                <span
                  className="font-bebas text-3xl tracking-wider relative z-10 select-none"
                  style={{ fontFamily: "var(--font-bebas), sans-serif" }}
                >
                  V
                </span>
              </div>
            </div>
          </div>

          {/* Orbiting dots */}
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "2.5s" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-sm" />
          </div>
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "3.5s", animationDirection: "reverse" }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary/40 rounded-full" />
          </div>
        </div>

        {/* Brand Text */}
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-2xl tracking-[0.15em] text-primary font-bold select-none"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            VILTRUM
          </span>
          <span className="text-[8px] font-bold tracking-[0.5em] text-muted uppercase">
            Loading Arsenal
          </span>
        </div>

        {/* Bottom progress bar */}
        <div className="w-48 h-[2px] bg-border-light rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-primary rounded-full"
            style={{
              animation: "viltrumProgress 1.8s ease-in-out forwards",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes viltrumProgress {
          0% {
            width: 0%;
          }
          20% {
            width: 15%;
          }
          50% {
            width: 55%;
          }
          80% {
            width: 85%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
