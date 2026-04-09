"use client";

import { MessageCircle, Camera, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="bg-white border-t border-zinc-100"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 sm:py-32 md:py-40">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-12">
          
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-8">
            <div className="flex flex-col">
              <span className="font-display text-4xl sm:text-5xl leading-none tracking-[0.15em] text-zinc-900">
                VILTRUM
              </span>
              <span className="text-[11px] uppercase tracking-[0.35em] text-zinc-400 font-semibold mt-3">
                Egypt Performance
              </span>
            </div>
            <p className="max-w-sm text-base sm:text-lg leading-relaxed text-zinc-400 font-light">
              We build performancewear for people who care about how they move,
              how they train, and how they show up.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 md:col-start-7 space-y-8">
            <h3 className="text-[11px] font-semibold tracking-[0.35em] text-zinc-900 uppercase">
              Navigate
            </h3>
            <div className="flex flex-col space-y-5">
              <Link
                href="/products"
                className="w-fit text-base text-zinc-400 hover:text-zinc-900 transition-colors duration-300 font-light tracking-wide"
              >
                Shop Collection
              </Link>
              <a
                href="#about"
                className="w-fit text-base text-zinc-400 hover:text-zinc-900 transition-colors duration-300 font-light tracking-wide"
              >
                About Us
              </a>
              <a
                href="https://wa.me/201031429229"
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-base text-zinc-400 hover:text-zinc-900 transition-colors duration-300 font-light tracking-wide"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Connect Column */}
          <div className="md:col-span-2 space-y-8">
            <h3 className="text-[11px] font-semibold tracking-[0.35em] text-zinc-900 uppercase">
              Connect
            </h3>
            <div className="flex gap-3">
              <a
                href="https://wa.me/201031429229"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full text-zinc-400 bg-zinc-50 border border-zinc-100 hover:border-zinc-300 hover:text-zinc-900 transition-all duration-300"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-full text-zinc-400 bg-zinc-50 border border-zinc-100 hover:border-zinc-300 hover:text-zinc-900 transition-all duration-300"
                aria-label="Instagram"
              >
                <Camera size={18} />
              </a>
              <a
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-full text-zinc-400 bg-zinc-50 border border-zinc-100 hover:border-zinc-300 hover:text-zinc-900 transition-all duration-300"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 sm:mt-32 pt-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] text-zinc-300 tracking-[0.25em] uppercase font-semibold">
            © {new Date().getFullYear()} VILTRUM EGYPT. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="w-2 h-2 rounded-full bg-zinc-100 hover:bg-zinc-900 transition-colors duration-500"
              aria-label="Admin"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
