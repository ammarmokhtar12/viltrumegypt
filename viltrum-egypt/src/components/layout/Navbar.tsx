"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ShoppingBag, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCartStore } from "@/store/cart";

interface NavbarProps {
  onCartOpen: () => void;
}

export default function Navbar({ onCartOpen }: NavbarProps) {
  const { theme, setTheme } = useTheme();
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border-color py-4"
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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#191414_0%,#0c0c0c_100%)] shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-105">
            <span className="text-gradient-blood font-display text-3xl leading-none">V</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-[2rem] leading-none tracking-[0.14em] text-foreground transition-colors duration-300">
              VILTRUM
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
              Egypt Performance
            </span>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-10">
          <a
            href="#products"
            className="text-[12px] tracking-[0.24em] text-foreground/60 hover:text-foreground transition-colors duration-300 uppercase font-semibold"
          >
            Collection
          </a>
          <a
            href="#about"
            className="text-[12px] tracking-[0.24em] text-foreground/60 hover:text-foreground transition-colors duration-300 uppercase font-semibold"
          >
            Brand Story
          </a>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] tracking-[0.24em] text-foreground/60 hover:text-foreground transition-colors duration-300 uppercase font-semibold"
          >
            WhatsApp
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-color bg-foreground/[0.03] text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] transition-all duration-300"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            id="cart-button"
            onClick={onCartOpen}
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-border-color bg-foreground/[0.03] text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] transition-all duration-300"
            aria-label="Open cart"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-viltrum-red text-[10px] font-bold text-white shadow-[0_0_12px_rgba(178,0,0,0.5)]">
                {itemCount}
              </span>
            )}
          </button>

          <button
            className="md:hidden flex h-12 w-12 items-center justify-center rounded-2xl border border-border-color bg-foreground/[0.03] text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] transition-all duration-300"
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
        <div className="glass mx-4 mt-4 rounded-[24px] p-8 space-y-6 border border-viltrum-white/5">
          <a
            href="#products"
            className="block text-[12px] tracking-[0.24em] text-foreground/60/70 hover:text-foreground transition-colors duration-300 uppercase font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Collection
          </a>
          <a
            href="#about"
            className="block text-[12px] tracking-[0.24em] text-foreground/60/70 hover:text-foreground transition-colors duration-300 uppercase font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Brand Story
          </a>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[12px] tracking-[0.24em] text-foreground/60/70 hover:text-foreground transition-colors duration-300 uppercase font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            WhatsApp
          </a>
        </div>
      </div>
    </nav>
  );
}
