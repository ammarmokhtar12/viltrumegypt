"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart";

interface NavbarProps {
  onCartOpen: () => void;
}

export default function Navbar({ onCartOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const itemCount = mounted ? totalItems() : 0;

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled
          ? "glass py-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent py-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-3 group"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-viltrum-red to-viltrum-red-dark flex items-center justify-center red-glow transition-transform duration-300 group-hover:scale-110">
            <span className="text-white font-display font-black text-sm">V</span>
          </div>
          <span className="text-lg font-display font-black tracking-[0.3em] text-viltrum-white group-hover:text-gradient-silver transition-all duration-300">
            VILTRUM
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-10">
          <a
            href="#products"
            className="text-[12px] tracking-[0.2em] text-viltrum-mist/60 hover:text-viltrum-white transition-colors duration-300 uppercase font-medium"
          >
            Shop
          </a>
          <a
            href="#about"
            className="text-[12px] tracking-[0.2em] text-viltrum-mist/60 hover:text-viltrum-white transition-colors duration-300 uppercase font-medium"
          >
            About
          </a>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] tracking-[0.2em] text-viltrum-mist/60 hover:text-viltrum-white transition-colors duration-300 uppercase font-medium"
          >
            Contact
          </a>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Cart Button */}
          <button
            id="cart-button"
            onClick={onCartOpen}
            className="relative p-2.5 rounded-xl text-viltrum-mist/60 hover:text-viltrum-white hover:bg-viltrum-white/5 transition-all duration-300"
            aria-label="Open cart"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-viltrum-red text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(178,0,0,0.5)]">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2.5 rounded-xl text-viltrum-mist/60 hover:text-viltrum-white hover:bg-viltrum-white/5 transition-all duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${
          mobileMenuOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass mx-4 mt-4 rounded-xl p-8 space-y-6 border border-viltrum-white/5">
          <a
            href="#products"
            className="block text-[12px] tracking-[0.2em] text-viltrum-mist/60 hover:text-viltrum-white transition-colors duration-300 uppercase font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            Shop
          </a>
          <a
            href="#about"
            className="block text-[12px] tracking-[0.2em] text-viltrum-mist/60 hover:text-viltrum-white transition-colors duration-300 uppercase font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </a>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[12px] tracking-[0.2em] text-viltrum-mist/60 hover:text-viltrum-white transition-colors duration-300 uppercase font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
}
