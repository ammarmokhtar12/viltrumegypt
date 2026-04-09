"use client";

import { MessageCircle, Camera, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="bg-white border-t border-zinc-100"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-6 space-y-8">
            <div className="flex flex-col">
              <span className="font-display text-4xl leading-none tracking-[0.15em] text-zinc-900 transition-colors duration-300">
                VILTRUM
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold mt-2">
                Egypt Performance
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-zinc-500">
              We build performancewear for people who care about how they move,
              how they train, and how they show up. Every piece is designed to
              feel premium from the first look to the final rep.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 space-y-8">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-900 uppercase">
              Navigate
            </h3>
            <div className="flex flex-col space-y-4">
              <a
                href="#products"
                className="w-fit text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-300 font-medium"
              >
                Shop Collection
              </a>
              <a
                href="#about"
                className="w-fit text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-300 font-medium"
              >
                Brand Story
              </a>
              <a
                href={`https://wa.me/201031429229`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-300 font-medium"
              >
                Support
              </a>
            </div>
          </div>

          {/* Connect Column */}
          <div className="md:col-span-3 space-y-8">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-900 uppercase">
               सोशल Connect
            </h3>
            <div className="flex gap-3">
              <a
                href="https://wa.me/201031429229"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center text-zinc-400 bg-zinc-50 rounded-sm hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-300"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center text-zinc-400 bg-zinc-50 rounded-sm hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-300"
                aria-label="Instagram"
              >
                <Camera size={18} />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center text-zinc-400 bg-zinc-50 rounded-sm hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-300"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-32 pt-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-zinc-400 tracking-[0.1em] uppercase font-bold">
            © {new Date().getFullYear()} VILTRUM EGYPT. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="w-1.5 h-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors duration-300"
              aria-label="Admin"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
