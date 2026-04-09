"use client";

import { MessageCircle, Camera, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="relative border-t border-viltrum-red/10"
      style={{
        background:
          "radial-gradient(ellipse at top center, rgba(184,15,10,0.12) 0%, rgba(8,8,8,0) 45%), linear-gradient(180deg, #111010 0%, #050505 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 md:py-32">
        {/* CSS Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,#191414_0%,#0c0c0c_100%)] shadow-[0_12px_28px_rgba(0,0,0,0.36)]">
                <span className="text-gradient-blood font-display text-4xl leading-none">V</span>
              </div>
              <div>
                <span className="block font-display text-[2.4rem] leading-none tracking-[0.16em] text-viltrum-white">
                  VILTRUM
                </span>
                <span className="text-[11px] uppercase tracking-[0.28em] text-viltrum-mist">
                  Egypt Performance
                </span>
              </div>
            </div>
            <p className="max-w-md text-[15px] leading-relaxed text-viltrum-silver/78">
              We build performancewear for people who care about how they move,
              how they train, and how they show up. Every piece is designed to
              feel premium from the first look to the final rep.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 md:col-start-7 space-y-6">
            <h3 className="text-[11px] font-bold tracking-[0.3em] text-viltrum-red uppercase">
              Navigate
            </h3>
            <div className="flex flex-col space-y-4">
              <a
                href="#products"
                className="w-fit text-[14px] text-viltrum-mist/75 hover:text-viltrum-white transition-colors duration-300"
              >
                Shop Collection
              </a>
              <a
                href="#about"
                className="w-fit text-[14px] text-viltrum-mist/75 hover:text-viltrum-white transition-colors duration-300"
              >
                Brand Story
              </a>
              <a
                href={`https://wa.me/201031429229`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-[14px] text-viltrum-mist/75 hover:text-viltrum-white transition-colors duration-300"
              >
                Customer Support
              </a>
            </div>
          </div>

          {/* Connect Column */}
          <div className="md:col-span-3 space-y-6">
            <h3 className="text-[11px] font-bold tracking-[0.3em] text-viltrum-red uppercase">
              Connect
            </h3>
            <p className="max-w-xs text-[14px] leading-relaxed text-viltrum-mist/80">
              Reach out for sizing help, order follow-up, or direct purchase
              guidance.
            </p>
            <div className="flex gap-4">
              <a
                href="https://wa.me/201031429229"
                target="_blank"
                rel="noopener noreferrer"
                className="social-glow flex h-11 w-11 items-center justify-center text-viltrum-mist/50 bg-[#0A0A0A]"
                aria-label="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="#"
                className="social-glow flex h-11 w-11 items-center justify-center text-viltrum-mist/50 bg-[#0A0A0A]"
                aria-label="Instagram"
              >
                <Camera size={16} />
              </a>
              <a
                href="#"
                className="social-glow flex h-11 w-11 items-center justify-center text-viltrum-mist/50 bg-[#0A0A0A]"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-32 pt-10 border-t border-viltrum-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-viltrum-mist/30 tracking-[0.18em] uppercase">
            © {new Date().getFullYear()} VILTRUM EGYPT. ALL RIGHTS RESERVED.
          </p>
          <p className="text-[10px] font-bold text-viltrum-mist/20 tracking-[0.28em] uppercase">
            Precision wear for serious training.
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
