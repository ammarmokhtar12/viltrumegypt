"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart";

interface NavbarProps {
  onCartOpen: () => void;
}

export default function Navbar({ onCartOpen }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const itemCount = mounted ? totalItems() : 0;
  
  if (!mounted) return null;

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-zinc-200 py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <a
          href="#"
          className="flex items-center gap-3 group"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="flex flex-col">
            <span className="font-display text-3xl leading-none tracking-[0.15em] text-zinc-900 transition-colors duration-300">
              VILTRUM
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
              Egypt Performance
            </span>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-10">
          <a
            href="#products"
            className="text-xs tracking-[0.2em] text-zinc-500 hover:text-zinc-900 transition-colors duration-300 uppercase font-bold"
          >
            Collection
          </a>
          <a
            href="#about"
            className="text-xs tracking-[0.2em] text-zinc-500 hover:text-zinc-900 transition-colors duration-300 uppercase font-bold"
          >
            Brand Story
          </a>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs tracking-[0.2em] text-zinc-500 hover:text-zinc-900 transition-colors duration-300 uppercase font-bold"
          >
            WhatsApp
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="cart-button"
            onClick={onCartOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-all duration-300"
            aria-label="Open cart"
          >
            <ShoppingBag size={18} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>

          <button
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-sm bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-all duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-out bg-white border-b border-zinc-200 ${
          mobileMenuOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0 border-transparent"
        }`}
      >
        <div className="px-6 py-6 space-y-6">
          <a
            href="#products"
            className="block text-xs tracking-[0.2em] text-zinc-600 hover:text-zinc-900 transition-colors duration-300 uppercase font-bold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Collection
          </a>
          <a
            href="#about"
            className="block text-xs tracking-[0.2em] text-zinc-600 hover:text-zinc-900 transition-colors duration-300 uppercase font-bold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Brand Story
          </a>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs tracking-[0.2em] text-zinc-600 hover:text-zinc-900 transition-colors duration-300 uppercase font-bold"
            onClick={() => setMobileMenuOpen(false)}
          >
            WhatsApp
          </a>
        </div>
      </div>
    </nav>
  );
}
