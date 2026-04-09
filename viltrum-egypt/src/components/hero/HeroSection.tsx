import React from 'react';

export default function HeroSection() {
  return (
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
        </div>
      </div>
    </section>
  );
}
