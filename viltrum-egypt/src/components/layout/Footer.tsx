"use client";

import { MessageCircle, Camera, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="bg-black border-t border-zinc-800"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 sm:py-28">
        <div className="grid grid-cols-1 gap-12 text-left md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Join Viltrum
            </h2>
            <p className="text-sm text-zinc-300">
              Get updates on premium drops and member-only releases.
            </p>
            <div className="max-w-xs">
              <Link href="/login" className="btn-primary w-full h-14 text-xs tracking-[0.2em]">
                Subscribe
              </Link>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-300">
              Brand
            </h3>
            <p className="text-xl font-extrabold leading-none tracking-[0.2em] text-white">
              VILTRUM
            </p>
            <p className="text-sm text-zinc-300">
              Premium performancewear crafted for elite athletes.
            </p>
          </div>

          <div className="space-y-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-300">
              Navigate
            </h3>
            <div className="flex flex-col gap-3">
              <Link href="/products" className="text-sm text-zinc-300 transition-colors hover:text-white">
                Shop Collection
              </Link>
              <a href="#about" className="text-sm text-zinc-300 transition-colors hover:text-white">
                About Us
              </a>
              <a href="https://wa.me/201031429229" className="text-sm text-zinc-300 transition-colors hover:text-white">
                WhatsApp Support
              </a>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-300">
              Connect
            </h3>
            <div className="flex gap-3">
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 text-white/80 transition-colors hover:text-white">
                <MessageCircle size={18} />
              </a>
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 text-white/80 transition-colors hover:text-white">
                <Camera size={18} />
              </a>
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 text-white/80 transition-colors hover:text-white">
                <Mail size={18} />
              </a>
            </div>
            <Link href="/admin" className="inline-block text-xs text-zinc-500 hover:text-zinc-300">
              Admin
            </Link>
          </div>
        </div>

        <div className="mt-14 border-t border-zinc-800 pt-8">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
            © {new Date().getFullYear()} VILTRUM EGYPT. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
