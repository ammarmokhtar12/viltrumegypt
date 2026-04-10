"use client";

import { MessageCircle, Camera, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="bg-slate-50 border-t border-zinc-200"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-28 sm:py-36">
        <div className="flex flex-col items-center text-center space-y-24">
          
          {/* Subscribe Section */}
          <div className="w-full max-w-2xl space-y-10">
            <div className="space-y-5">
              <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
                Subscribe to our Dream
              </h2>
              <p className="text-zinc-600 text-xl font-light max-w-lg mx-auto leading-relaxed">
                Join the inner circle. Be the first to witness new drops and exclusive athlete events.
              </p>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="relative mx-auto max-w-lg overflow-hidden">
               <input 
                 type="email" 
                 placeholder="your@email.com" 
                 className="h-16 w-full rounded-full border border-zinc-200 bg-white pl-6 pr-40 text-zinc-900 placeholder:text-zinc-600 transition-all focus:border-zinc-400 focus:outline-none"
               />
               <button className="absolute bottom-2 right-2 top-2 rounded-full bg-zinc-900 px-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-zinc-700">
                  Subscribe
               </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-20 w-full">
            {/* Column 1: Brand */}
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-extrabold leading-none tracking-[0.2em] text-zinc-900">
                  VILTRUM
                </span>
                <span className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 font-bold mt-2">
                  Egypt Performance
                </span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed font-light">
                Premium performancewear crafted for the elite athlete.
              </p>
            </div>

            {/* Column 2: Navigate */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-900">
                Navigate
              </h3>
              <div className="flex flex-col items-center space-y-4">
                <Link href="/products" className="text-sm font-light tracking-wide text-zinc-600 transition-all hover:text-zinc-900">
                  Shop Collection
                </Link>
                <a href="#about" className="text-sm font-light tracking-wide text-zinc-600 transition-all hover:text-zinc-900">
                  About Us
                </a>
                <a href="https://wa.me/201031429229" className="text-sm font-light tracking-wide text-zinc-600 transition-all hover:text-zinc-900">
                  WhatsApp Support
                </a>
              </div>
            </div>

            {/* Column 3: Connect */}
            <div className="space-y-6">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-900">
                Connect
              </h3>
              <div className="flex justify-center gap-4">
                <a href="#" className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-zinc-400 hover:text-zinc-900">
                  <MessageCircle size={18} />
                </a>
                <a href="#" className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-zinc-400 hover:text-zinc-900">
                  <Camera size={18} />
                </a>
                <a href="#" className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-zinc-400 hover:text-zinc-900">
                  <Mail size={18} />
                </a>
              </div>
            </div>
          </div>

          <div className="w-full pt-12 border-t border-zinc-200 flex flex-col items-center gap-8">
            <p className="text-[10px] text-zinc-600 tracking-[0.3em] uppercase font-bold text-center">
              © {new Date().getFullYear()} VILTRUM EGYPT. ALL RIGHTS RESERVED.
            </p>
            
            <Link
              href="/admin"
              className="h-4 w-4 rounded-full bg-zinc-800 transition-all duration-700 hover:bg-zinc-900"
              aria-label="Admin"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
