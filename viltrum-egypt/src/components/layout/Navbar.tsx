"use client";

import { ShoppingBag, Menu, X, Phone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";

interface NavbarProps {
  onCartOpen: () => void;
}

export default function Navbar({ onCartOpen }: NavbarProps) {
  const totalItems = useCartStore((s) => s.totalItems);
  const { user } = useAuthStore();
  const itemCount = totalItems();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted) return null;

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "premium-blur shadow-lg"
          : "bg-transparent"
      }`}
    >
      {/* Eid Offer Announcement Banner */}
      <div className="eid-banner text-white text-center py-2.5 px-4 text-xs font-bold uppercase tracking-widest relative z-50 flex items-center justify-center gap-2 border-b border-white/10 select-none">
        <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#fbbf24]"></span>
        <span className="font-sans text-[10px] sm:text-xs tracking-[0.05em] text-white/95 flex items-center gap-1 select-none">
          🔥 <span className="eid-glow-text">استنوا أقوى عروض العيد من VILTRUM</span> · خصومات دمار شامل وتصاميم حصرية قريباً! 🔥
        </span>
      </div>

      <div className={`mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 uppercase transition-all duration-500 ${
        scrolled
          ? "py-3"
          : "py-6"
      }`}>
        {/* Brand - Left */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-3xl font-bebas tracking-[0.1em] text-primary">VILTRUM</span>
            <span className="text-[8px] font-bold tracking-[0.5em] text-accent mt-1 ml-0.5">EST. 2024</span>
          </Link>
        </div>

        {/* Links - Center (Desktop) */}
        <div className="hidden lg:flex items-center gap-12 uppercase tracking-[0.2em] text-[10px] font-bold">
          <Link href="/" className="text-foreground hover:text-accent transition-colors">
            Collections
          </Link>
          <Link href="/products" className="text-foreground hover:text-accent transition-colors">
            Archive
          </Link>
          <a
             href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201017326887"}`}
             target="_blank"
             rel="noopener noreferrer"
             className="text-foreground hover:text-accent transition-colors"
          >
            Concierge
          </a>
        </div>

        {/* Actions - Right */}
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="hidden md:flex items-center gap-2 text-sm font-bold text-foreground">
            <Phone size={16} className="text-secondary" />
            <span>+201031429229</span>
          </div>

          <button
            onClick={onCartOpen}
            className="flex items-center gap-2 group transition-opacity relative"
          >
            <div className="relative">
              <ShoppingBag strokeWidth={1.5} size={22} className="text-foreground group-hover:text-secondary transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center bg-secondary text-white text-[9px] font-bold rounded-full">
                  {itemCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-foreground hover:text-secondary transition-colors"
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-border-light shadow-xl px-4 py-8 flex flex-col gap-6 selection:bg-secondary selection:text-white">
          <Link href="/" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-foreground border-b border-gray-50 pb-2">
            Home
          </Link>
          <Link href="/products" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-foreground border-b border-gray-50 pb-2">
            Products
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="text-lg font-medium text-foreground border-b border-gray-50 pb-2"
          >
            Contact
          </a>

          <div className="flex items-center gap-3 pt-4 font-bold text-secondary">
            <Phone size={20} />
            <span>+201031429229</span>
          </div>
        </div>
      )}
    </nav>
  );
}

