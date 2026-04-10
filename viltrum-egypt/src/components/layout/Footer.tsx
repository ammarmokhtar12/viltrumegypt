"use client";

import { MessageCircle, Camera, Mail, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="bg-surface border-t border-border-light"
    >
      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Join the Viltrum Movement
          </h2>
          <p className="text-base sm:text-lg text-secondary leading-relaxed max-w-md mx-auto">
            Be the first to know about new drops, exclusive offers, and limited editions.
          </p>
          <div className="pt-4">
            <Link
              href="/register"
              className="btn-primary px-10 py-4 text-sm"
            >
              Create Account
              <ArrowUpRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="border-t border-border-light" />
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 sm:py-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-12">

          {/* Brand — takes more space */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-background font-display text-xl">V</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-[0.18em] text-foreground">
                  VILTRUM
                </span>
                <span className="text-[9px] uppercase tracking-[0.35em] text-muted mt-0.5">
                  Egypt Performance
                </span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-secondary leading-relaxed max-w-sm">
              Premium performancewear crafted for the elite athlete.
              Forged in strength, worn by warriors. Every piece is designed
              to push your limits and elevate your game.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              <a
                href="https://wa.me/201031429229"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-light bg-background text-secondary transition-all duration-200 hover:text-foreground hover:border-secondary hover:-translate-y-0.5"
              >
                <MessageCircle size={17} />
              </a>
              <a
                href="#"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-light bg-background text-secondary transition-all duration-200 hover:text-foreground hover:border-secondary hover:-translate-y-0.5"
              >
                <Camera size={17} />
              </a>
              <a
                href="#"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-light bg-background text-secondary transition-all duration-200 hover:text-foreground hover:border-secondary hover:-translate-y-0.5"
              >
                <Mail size={17} />
              </a>
            </div>
          </div>

          {/* Navigate */}
          <div className="md:col-span-3 md:col-start-7">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted mb-8">
              Navigate
            </h3>
            <div className="flex flex-col space-y-5">
              <Link href="/" className="text-sm sm:text-base text-secondary transition-colors hover:text-foreground">
                Home
              </Link>
              <Link href="/products" className="text-sm sm:text-base text-secondary transition-colors hover:text-foreground">
                Shop Collection
              </Link>
              <a href="#about" className="text-sm sm:text-base text-secondary transition-colors hover:text-foreground">
                About Us
              </a>
              <a
                href="https://wa.me/201031429229"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base text-secondary transition-colors hover:text-foreground"
              >
                WhatsApp Support
              </a>
            </div>
          </div>

          {/* Help */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted mb-8">
              Help
            </h3>
            <div className="flex flex-col space-y-5">
              <Link href="/login" className="text-sm sm:text-base text-secondary transition-colors hover:text-foreground">
                My Account
              </Link>
              <Link href="/checkout" className="text-sm sm:text-base text-secondary transition-colors hover:text-foreground">
                Checkout
              </Link>
              <a
                href="https://wa.me/201031429229"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base text-secondary transition-colors hover:text-foreground"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border-light">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-muted tracking-wide">
            © {new Date().getFullYear()} Viltrum Egypt. All rights reserved.
          </p>
          <Link
            href="/admin"
            className="h-2 w-2 rounded-full bg-muted/20 transition-all duration-700 hover:bg-foreground"
            aria-label="Admin"
          />
        </div>
      </div>
    </footer>
  );
}
