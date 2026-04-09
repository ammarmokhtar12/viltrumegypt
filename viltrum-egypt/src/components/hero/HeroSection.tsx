import React from 'react';

export default function HeroSection() {
  return (
<<<<<<< HEAD
    <section className="relative bg-[#0a0a0a] py-32 px-6 flex flex-col items-center justify-center text-center">
      <div className="max-w-4xl mt-20">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-8">
          VILTRUM <span className="text-gray-500">EGYPT</span>
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          The future of AI automation. Built for speed, scaled for strength.
        </p>
        <div className="flex gap-6 justify-center">
          <button className="px-12 py-5 bg-white text-black font-bold rounded-full text-xl hover:scale-105 transition-all">
            Get Started
          </button>
          <button className="px-12 py-5 border-2 border-white text-white font-bold rounded-full text-xl hover:bg-white hover:text-black transition-all">
            Contact Us
          </button>
=======
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-viltrum-black"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(240,68,47,0.14),transparent_28%),linear-gradient(180deg,rgba(3,3,3,0.4),rgba(3,3,3,0.78))] z-0" />

      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-[#080808] pointer-events-none">
        <video
          ref={videoRef}
          src="/hero-video.mp4"
          poster="/products/Screenshot 2026-04-09 135734.png"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover video-mask opacity-0"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-black/30 to-[#080808] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-transparent to-[#080808] opacity-70" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-16 pt-28 text-center sm:px-6 lg:px-8">
        <div
          ref={badgeRef}
          className="section-eyebrow mb-8"
        >
          <span className="section-eyebrow-dot animate-pulse" />
          Elite Performance Essentials
        </div>

        <h1
          ref={titleRef}
          className="section-title text-[4.5rem] sm:text-[6.5rem] md:text-[8rem] lg:text-[10rem]"
          style={{
            textShadow:
              "0 24px 70px rgba(0,0,0,0.78), 0 0 36px rgba(184,15,10,0.12)",
          }}
        >
          <span className="block text-viltrum-white">TRAIN HARD.</span>
          <span className="mt-1 block text-gradient-blood">LOOK SHARP.</span>
        </h1>

        <p
          ref={subtitleRef}
          className="surface-panel mt-8 max-w-3xl rounded-[28px] px-6 py-6 text-base leading-relaxed text-viltrum-silver md:px-8 md:text-xl"
        >
          Premium compression wear crafted for athletes who want discipline in
          performance and confidence in presentation. Clean cuts, aggressive
          detailing, and a presence that feels instantly premium.
        </p>

        <div
          ref={ctaRef}
          className="mt-12 flex w-full max-w-md flex-col justify-center gap-4 mx-auto sm:max-w-none sm:flex-row"
        >
          <a
            href="#products"
            className="armor-btn group inline-flex items-center justify-center gap-3 px-8 py-4 text-[13px] font-extrabold tracking-[0.22em] uppercase"
          >
            <span className="relative z-10 flex items-center gap-2">
              Shop The Drop
              <ChevronRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1.5"
              />
            </span>
          </a>
          <a
            href="#about"
            className="armor-ghost-btn inline-flex items-center justify-center px-8 py-4 text-[13px] font-bold tracking-[0.18em] uppercase backdrop-blur-md"
          >
            Why Viltrum
          </a>
>>>>>>> 9349298 (feat: premium compression brand UI and fixed package structure)
        </div>

        <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="surface-panel rounded-[24px] px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-viltrum-mist">
              Material
            </p>
            <p className="mt-2 text-xl font-semibold text-viltrum-white">
              Sculpted compression fit
            </p>
          </div>
          <div className="surface-panel rounded-[24px] px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-viltrum-mist">
              Presence
            </p>
            <p className="mt-2 text-xl font-semibold text-viltrum-white">
              Premium silhouette on and off gym floor
            </p>
          </div>
          <div className="surface-panel rounded-[24px] px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-viltrum-mist">
              Finish
            </p>
            <p className="mt-2 text-xl font-semibold text-viltrum-white">
              Sharp details with high-end contrast
            </p>
          </div>
        </div>
      </div>
<<<<<<< HEAD
=======

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce z-10">
        <span className="text-[10px] tracking-[0.4em] text-viltrum-white/50 uppercase font-bold drop-shadow-md">
          Scroll
        </span>
        <ArrowDown size={16} className="text-viltrum-white/50 drop-shadow-md" />
      </div>
>>>>>>> 9349298 (feat: premium compression brand UI and fixed package structure)
    </section>
  );
}
