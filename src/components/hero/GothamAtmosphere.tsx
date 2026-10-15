"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import BatLogo from "@/components/ui/BatLogo";

export default function GothamAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [signalActive, setSignalActive] = useState(true);
  const [lightning, setLightning] = useState(false);
  const [batsVisible, setBatsVisible] = useState(false);

  // Synthesize cinematic Batman thunder rumble using Web Audio API
  const playThunder = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Deep thunder rumble (filtered white noise + low frequency oscillators)
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(140, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.8);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const triggerBatSignal = () => {
    setLightning(true);
    setBatsVisible(true);
    playThunder();

    setTimeout(() => setLightning(false), 220);
    setTimeout(() => {
      setLightning(true);
      setTimeout(() => setLightning(false), 120);
    }, 320);

    setTimeout(() => setBatsVisible(false), 4500);
  };

  // Gotham Rain Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Raindrop particles
    const dropsCount = Math.min(80, Math.floor(width / 15));
    const drops = Array.from({ length: dropsCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 12 + Math.random() * 18,
      speed: 12 + Math.random() * 10,
      opacity: 0.12 + Math.random() * 0.22,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle Gotham noir rain
      ctx.lineWidth = 1.2;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.strokeStyle = `rgba(180, 210, 255, ${d.opacity})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.length);
        ctx.stroke();

        d.y += d.speed;
        d.x -= 1.2;

        if (d.y > height) {
          d.y = -d.length;
          d.x = Math.random() * (width + 50);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    // Occasional subtle distant lightning flash
    const lightningInterval = setInterval(() => {
      if (Math.random() > 0.45) {
        setLightning(true);
        setTimeout(() => setLightning(false), 90);
      }
    }, 12000);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      clearInterval(lightningInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">
      {/* Rain Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-60"
      />

      {/* Atmospheric Lightning Flash */}
      <div
        className={`absolute inset-0 bg-blue-100/15 transition-opacity duration-75 pointer-events-none mix-blend-overlay ${
          lightning ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Gotham Fog Mist Layer at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

      {/* THE BAT-SIGNAL (Searchlight & Sky Projection) */}
      <div
        className={`absolute top-12 right-6 sm:right-24 md:right-36 w-64 h-64 sm:w-80 sm:h-80 transition-all duration-1000 ${
          signalActive ? "opacity-95 scale-100" : "opacity-20 scale-90"
        }`}
      >
        {/* Volumetric Spotlight Searchlight Cone */}
        <div
          className="absolute -bottom-64 -right-16 w-96 h-[600px] pointer-events-none transform -rotate-25 origin-bottom opacity-35"
          style={{
            background:
              "conic-gradient(from 170deg at 50% 100%, transparent 0deg, rgba(254, 240, 138, 0.22) 15deg, rgba(255, 255, 255, 0.45) 20deg, rgba(254, 240, 138, 0.22) 25deg, transparent 40deg)",
            filter: "blur(18px)",
          }}
        />

        {/* Ambient Bat-Signal Glowing Disk in the Clouds */}
        <div
          className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full flex items-center justify-center animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 230, 140, 0.75) 0%, rgba(245, 180, 50, 0.4) 45%, rgba(200, 120, 20, 0.15) 70%, transparent 85%)",
            boxShadow:
              "0 0 80px 20px rgba(245, 180, 50, 0.35), inset 0 0 40px rgba(255, 255, 255, 0.6)",
            filter: "drop-shadow(0 0 25px rgba(255, 215, 0, 0.6))",
          }}
        >
          {/* Bat Emblem inside the Signal */}
          <div className="w-24 sm:w-32 text-black/90 transform scale-110 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            <BatLogo className="w-full h-auto" />
          </div>

          {/* Cloud Mist over Signal */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 via-transparent to-black/30 pointer-events-none" />
        </div>
      </div>

      {/* Swarm of Bats (Flying Across Hero) */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          batsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bat-flock absolute bottom-1/3 left-0 w-full h-48">
          <div className="bat bat-1 absolute text-black/80 w-8 h-4">
            <BatLogo className="w-full h-auto animate-bounce" />
          </div>
          <div className="bat bat-2 absolute text-black/90 w-10 h-5">
            <BatLogo className="w-full h-auto animate-bounce delay-100" />
          </div>
          <div className="bat bat-3 absolute text-black/75 w-7 h-3.5">
            <BatLogo className="w-full h-auto animate-bounce delay-200" />
          </div>
        </div>
      </div>

      {/* Wayne Tactical HUD / Telemetry in corners */}
      <div className="hidden lg:flex absolute top-28 left-8 flex-col gap-1 text-[10px] font-mono tracking-widest text-zinc-500/80 uppercase pointer-events-none">
        <span className="flex items-center gap-1.5 text-amber-500/90 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          WAYNE ENTERPRISES TACTICAL
        </span>
        <span>SECTOR: GOTHAM SHADOWS</span>
        <span>SYS: COMPRESSION ARMOR v4.2</span>
      </div>

      {/* Interactive Bat-Signal Call Button */}
      <div className="absolute bottom-6 right-5 sm:right-8 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={triggerBatSignal}
          title="Call The Bat / Trigger Bat-Signal"
          className="group relative flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-black/80 hover:bg-black/95 text-amber-400 border border-amber-500/30 hover:border-amber-400/80 shadow-[0_0_20px_rgba(245,180,50,0.2)] hover:shadow-[0_0_28px_rgba(245,180,50,0.5)] transition-all duration-300 text-[11px] font-mono uppercase tracking-wider backdrop-blur-md active:scale-95"
        >
          <BatLogo className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          <span className="font-semibold text-zinc-200 group-hover:text-amber-300 transition-colors">
            Bat-Signal
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        </button>
      </div>

      <style jsx>{`
        .bat-1 {
          animation: flyAcross 4s linear infinite;
          top: 20%;
        }
        .bat-2 {
          animation: flyAcross 3.6s ease-in-out infinite 0.4s;
          top: 45%;
        }
        .bat-3 {
          animation: flyAcross 4.4s linear infinite 0.8s;
          top: 65%;
        }

        @keyframes flyAcross {
          0% {
            transform: translateX(-50px) translateY(0) scale(0.6);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(110vw) translateY(-80px) scale(1.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
