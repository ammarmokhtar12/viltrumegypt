"use client";

import { MessageCircle, Camera, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="bg-white border-t border-zinc-100"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-32 md:py-48">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-24 md:gap-12">
          
          {/* Brand Column */}
          <div className="md:col-span-6 space-y-12">
            <div className="flex flex-col">
              <span className="font-display text-5xl leading-none tracking-[0.2em] text-zinc-900">
                VILTRUM
              </span>
              <span className="text-xs uppercase tracking-[0.4em] text-zinc-400 font-bold mt-4">
                Egypt Performance
              </span>
            </div>
            <p className="max-w-md text-[15px] leading-relaxed text-zinc-500 font-medium">
              We build performancewear for people who care about how they move,
              how they train, and how they show up. Every piece is designed to
              feel premium from the first look to the final rep.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 space-y-10">
            <h3 className="text-xs font-bold tracking-[0.3em] text-zinc-900 uppercase">
              Navigate
            </h3>
            <div className="flex flex-col space-y-5">
              <a
                href="#products"
                className="w-fit text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-300 font-bold tracking-wide"
              >
                Shop Collection
              </a>
              <a
                href="#about"
                className="w-fit text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-300 font-bold tracking-wide"
              >
                Brand Story
              </a>
              <a
                href={`https://wa.me/201031429229`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-300 font-bold tracking-wide"
              >
                Support
              </a>
            </div>
          </div>

          {/* Connect Column */}
          <div className="md:col-span-3 space-y-10">
            <h3 className="text-xs font-bold tracking-[0.3em] text-zinc-900 uppercase">
              Connect
            </h3>
            <div className="flex gap-4">
              <a
                href="https://wa.me/201031429229"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center text-zinc-400 bg-zinc-50 border border-zinc-100 hover:border-zinc-900 hover:text-zinc-900 transition-all duration-300"
                aria-label="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
              <a
                href="#"
                className="flex h-12 w-12 items-center justify-center text-zinc-400 bg-zinc-50 border border-zinc-100 hover:border-zinc-900 hover:text-zinc-900 transition-all duration-300"
                aria-label="Instagram"
              >
                <Camera size={20} />
              </a>
              <a
                href="#"
                className="flex h-12 w-12 items-center justify-center text-zinc-400 bg-zinc-50 border border-zinc-100 hover:border-zinc-900 hover:text-zinc-900 transition-all duration-300"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-48 pt-16 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-xs text-zinc-400 tracking-[0.2em] uppercase font-bold">
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
