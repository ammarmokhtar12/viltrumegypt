"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

interface NavbarProps {
  onCartOpen: () => void;
}

export default function Navbar({ onCartOpen }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const itemCount = mounted ? totalItems() : 0;

  if (!mounted) return null;

  return (
    <>
      <nav
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md border-b border-zinc-100 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* Brand Logo — Left */}
          <Link
            href="/"
            className="flex items-center gap-3 group z-50"
          >
            <div className="flex flex-col">
              <span className="font-display text-2xl sm:text-3xl leading-none tracking-[0.2em] text-zinc-900 transition-colors duration-300">
                VILTRUM
              </span>
              <span className="text-[8px] uppercase tracking-[0.35em] text-zinc-400 font-semibold mt-1">
                Egypt
              </span>
            </div>
          </Link>

          {/* Right Side: Cart + Hamburger */}
          <div className="flex items-center gap-4 z-50">
            {/* Cart Button */}
            <button
              id="cart-button"
              onClick={onCartOpen}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-all duration-300"
              aria-label="Open cart"
            >
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Hamburger ☰ Button — Always visible */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-all duration-300"
              aria-label="Toggle menu"
            >
              <div className="flex flex-col items-center justify-center gap-[5px] w-[18px]">
                <span
                  className={`block h-[1.5px] bg-current transition-all duration-500 origin-center ${
                    menuOpen ? "w-full rotate-45 translate-y-[6.5px]" : "w-full"
                  }`}
                />
                <span
                  className={`block h-[1.5px] bg-current transition-all duration-500 ${
                    menuOpen ? "w-0 opacity-0" : "w-full opacity-100"
                  }`}
                />
                <span
                  className={`block h-[1.5px] bg-current transition-all duration-500 origin-center ${
                    menuOpen ? "w-full -rotate-45 -translate-y-[6.5px]" : "w-full"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Full-Screen Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-white transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="h-full flex flex-col items-center justify-center gap-12">
          {/* Navigation Links */}
          <nav className="flex flex-col items-center gap-10">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="text-4xl sm:text-5xl font-display font-medium text-zinc-900 hover:text-zinc-400 transition-colors duration-500 tracking-wider"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setMenuOpen(false)}
              className="text-4xl sm:text-5xl font-display font-medium text-zinc-900 hover:text-zinc-400 transition-colors duration-500 tracking-wider"
            >
              Products
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="text-4xl sm:text-5xl font-display font-medium text-zinc-900 hover:text-zinc-400 transition-colors duration-500 tracking-wider"
            >
              Contact
            </a>
          </nav>

          {/* Bottom info */}
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <p className="text-[10px] text-zinc-300 font-semibold uppercase tracking-[0.4em]">
              Viltrum Egypt — Premium Performance
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
