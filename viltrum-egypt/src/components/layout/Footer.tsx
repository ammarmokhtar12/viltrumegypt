"use client";

import { MessageCircle, Camera, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="relative border-t border-viltrum-red/10"
      style={{
        background: "radial-gradient(ellipse at top center, #0D0D0D 0%, #050505 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 md:py-24">
        {/* CSS Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-[#B20000] to-[#600000] flex items-center justify-center shadow-[0_0_20px_rgba(178,0,0,0.2)]">
                <span className="text-white font-display font-black text-xl">V</span>
              </div>
              <span className="text-2xl font-display font-black tracking-[0.3em] text-viltrum-white">
                VILTRUM
              </span>
            </div>
            <p className="text-[13px] text-viltrum-mist/50 leading-relaxed max-w-sm font-light">
              Forged in strength. Built for warriors. Our compression wear
              is engineered with Viltrumite precision for those who demand peak performance.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 md:col-start-7 space-y-6">
            <h3 className="text-[11px] font-bold tracking-[2px] text-viltrum-red uppercase">
              QUICK LINKS
            </h3>
            <div className="flex flex-col space-y-4">
              <a
                href="#products"
                className="w-fit text-[13px] text-viltrum-mist/60 hover:text-viltrum-white transition-colors duration-300"
              >
                SHOP COLLECTION
              </a>
              <a
                href="#about"
                className="w-fit text-[13px] text-viltrum-mist/60 hover:text-viltrum-white transition-colors duration-300"
              >
                SIZE GUIDE
              </a>
              <a
                href={`https://wa.me/201031429229`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-[13px] text-viltrum-mist/60 hover:text-viltrum-white transition-colors duration-300"
              >
                CUSTOMER SUPPORT
              </a>
            </div>
          </div>

          {/* Connect Column */}
          <div className="md:col-span-3 space-y-6">
            <h3 className="text-[11px] font-bold tracking-[2px] text-viltrum-red uppercase">
              CONNECT
            </h3>
            <div className="flex gap-4">
              <a
                href="https://wa.me/201031429229"
                target="_blank"
                rel="noopener noreferrer"
                className="social-glow w-10 h-10 flex items-center justify-center text-viltrum-mist/50 bg-[#0A0A0A]"
                aria-label="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="#"
                className="social-glow w-10 h-10 flex items-center justify-center text-viltrum-mist/50 bg-[#0A0A0A]"
                aria-label="Instagram"
              >
                <Camera size={16} />
              </a>
              <a
                href="#"
                className="social-glow w-10 h-10 flex items-center justify-center text-viltrum-mist/50 bg-[#0A0A0A]"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-viltrum-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-viltrum-mist/30 tracking-wider">
            © {new Date().getFullYear()} VILTRUM EGYPT. ALL RIGHTS RESERVED.
          </p>
          <p className="text-[10px] font-bold text-viltrum-mist/20 tracking-[0.25em] uppercase">
            Forged in Strength. Built for Warriors.
          </p>
        </div>

        {/* Hidden Admin Dot (#2A2A2A) */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/admin"
            className="w-[3px] h-[3px] rounded-full bg-[#2A2A2A] hover:bg-viltrum-red transition-colors duration-500 block"
            aria-label="Admin Access"
          />
        </div>
      </div>
    </footer>
  );
}
