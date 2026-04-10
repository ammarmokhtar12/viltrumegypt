"use client";

import { MessageCircle, Camera, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="bg-surface border-t border-border-light"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-background font-display text-base">V</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-[0.15em] text-foreground">VILTRUM</span>
                <span className="text-[8px] uppercase tracking-[0.3em] text-muted">Egypt</span>
              </div>
            </div>
            <p className="text-sm text-secondary leading-relaxed max-w-xs">
              Premium performancewear crafted for the elite athlete. Forged in strength, worn by warriors.
            </p>
          </div>

          {/* Navigate */}
          <div className="md:col-span-3 md:col-start-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted mb-5">
              Navigate
            </h3>
            <div className="flex flex-col space-y-3">
              <Link href="/products" className="text-sm text-secondary transition-colors hover:text-foreground">
                Shop Collection
              </Link>
              <a href="#about" className="text-sm text-secondary transition-colors hover:text-foreground">
                About Us
              </a>
              <a href="https://wa.me/201031429229" className="text-sm text-secondary transition-colors hover:text-foreground">
                WhatsApp Support
              </a>
            </div>
          </div>

          {/* Connect */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted mb-5">
              Connect
            </h3>
            <div className="flex gap-3">
              <a href="https://wa.me/201031429229" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-light bg-background text-secondary transition-all hover:text-foreground hover:border-secondary">
                <MessageCircle size={16} />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-light bg-background text-secondary transition-all hover:text-foreground hover:border-secondary">
                <Camera size={16} />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-light bg-background text-secondary transition-all hover:text-foreground hover:border-secondary">
                <Mail size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted tracking-wide">
            © {new Date().getFullYear()} Viltrum Egypt. All rights reserved.
          </p>
          <Link
            href="/admin"
            className="h-2 w-2 rounded-full bg-muted/30 transition-all duration-700 hover:bg-foreground"
            aria-label="Admin"
          />
        </div>
      </div>
    </footer>
  );
}
