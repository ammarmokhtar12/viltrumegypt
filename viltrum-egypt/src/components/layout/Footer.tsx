"use client";

import { MessageCircle, Camera, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="bg-white border-t border-zinc-100"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 sm:py-32">
        <div className="flex flex-col items-center text-center space-y-20">
          
          {/* Subscribe Section */}
          <div className="w-full max-w-2xl space-y-8">
            <div className="space-y-4">
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900">
                Subscribe to our Dream
              </h2>
              <p className="text-zinc-400 text-lg font-light max-w-md mx-auto">
                Join the inner circle. Be the first to witness new drops and exclusive athlete events.
              </p>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="relative max-w-lg mx-auto overflow-hidden">
               <input 
                 type="email" 
                 placeholder="your@email.com" 
                 className="viltrum-input pr-40 h-16"
               />
               <button className="absolute right-2 top-2 bottom-2 px-8 bg-zinc-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all">
                  Subscribe
               </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 w-full">
            {/* Column 1: Brand */}
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <span className="font-display text-2xl leading-none tracking-[0.2em] text-zinc-900">
                  VILTRUM
                </span>
                <span className="text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-bold mt-2">
                  Egypt Performance
                </span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Premium performancewear crafted for the elite athlete.
              </p>
            </div>

            {/* Column 2: Navigate */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-bold tracking-[0.4em] text-zinc-900 uppercase">
                Navigate
              </h3>
              <div className="flex flex-col items-center space-y-4">
                <Link href="/products" className="text-sm text-zinc-400 hover:text-zinc-900 transition-all font-light tracking-wide">
                  Shop Collection
                </Link>
                <a href="#about" className="text-sm text-zinc-400 hover:text-zinc-900 transition-all font-light tracking-wide">
                  About Us
                </a>
                <a href="https://wa.me/201031429229" className="text-sm text-zinc-400 hover:text-zinc-900 transition-all font-light tracking-wide">
                  WhatsApp Support
                </a>
              </div>
            </div>

            {/* Column 3: Connect */}
            <div className="space-y-6">
               <h3 className="text-[10px] font-bold tracking-[0.4em] text-zinc-900 uppercase">
                Connect
              </h3>
              <div className="flex justify-center gap-4">
                <a href="#" className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 transition-all">
                  <MessageCircle size={18} />
                </a>
                <a href="#" className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 transition-all">
                  <Camera size={18} />
                </a>
                <a href="#" className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 transition-all">
                  <Mail size={18} />
                </a>
              </div>
            </div>
          </div>

          <div className="w-full pt-12 border-t border-zinc-100 flex flex-col items-center gap-8">
            <p className="text-[10px] text-zinc-300 tracking-[0.3em] uppercase font-bold text-center">
              © {new Date().getFullYear()} VILTRUM EGYPT. ALL RIGHTS RESERVED.
            </p>
            
            <Link
              href="/admin"
              className="w-4 h-4 rounded-full bg-zinc-100 hover:bg-zinc-900 transition-all duration-700"
              aria-label="Admin"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
