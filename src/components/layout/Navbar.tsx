"use client";

import { ShoppingBag, Menu, X, Phone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart";
import BrandLogo from "@/components/layout/BrandLogo";

interface NavbarProps {
  onCartOpen: () => void;
}

export default function Navbar({ onCartOpen }: NavbarProps) {
  const totalItems = useCartStore((s) => s.totalItems);
  const itemCount = totalItems();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted) return null;

  const linkClass =
    "font-sans text-foreground hover:text-accent transition-colors";

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? "premium-blur shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="eid-banner overflow-hidden py-2.5 border-b border-border-light relative z-50 select-none">
        <div className="marquee-container flex whitespace-nowrap">
          <div className="marquee-content flex gap-16 text-[10px] font-semibold uppercase tracking-[0.25em] px-4 font-sans">
            <span className="eid-glow-text">
              EID OFFERS — ANTICIPATE THE ULTIMATE EID COLLECTION BY VILTRUM · EXCLUSIVE DESIGNS & SPECIAL DISCOUNTS COMING SOON
            </span>
            <span className="eid-glow-text">
              EID OFFERS — ANTICIPATE THE ULTIMATE EID COLLECTION BY VILTRUM · EXCLUSIVE DESIGNS & SPECIAL DISCOUNTS COMING SOON
            </span>
          </div>
        </div>
      </div>

      <div
        className={`mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
          scrolled ? "py-3" : "py-5"
        }`}
      >
        <div className="flex-shrink-0">
          <BrandLogo size="sm" />
        </div>

        <div className="hidden lg:flex items-center gap-12 uppercase tracking-[0.2em] text-[10px] font-semibold">
          <Link href="/#products" className={linkClass}>
            Collections
          </Link>
          <Link href="/products" className={linkClass}>
            Archive
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Contact
          </a>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-foreground font-sans">
            <Phone size={15} className="text-secondary" />
            <span>+201031429229</span>
          </div>

          <button
            onClick={onCartOpen}
            className="flex items-center group relative p-1"
            aria-label="Open cart"
          >
            <div className="relative">
              <ShoppingBag
                strokeWidth={1.5}
                size={22}
                className="text-foreground group-hover:text-accent transition-colors"
              />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center bg-secondary text-white text-[9px] font-semibold rounded-full font-sans">
                  {itemCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-foreground hover:text-accent transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-border-light shadow-xl px-6 py-8 flex flex-col gap-5 animate-mobile-menu">
          <Link
            href="/#products"
            onClick={() => setMobileOpen(false)}
            className="font-sans text-sm font-medium text-foreground border-b border-border-light pb-3 hover:text-accent transition-colors"
          >
            Collections
          </Link>
          <Link
            href="/products"
            onClick={() => setMobileOpen(false)}
            className="font-sans text-sm font-medium text-foreground border-b border-border-light pb-3 hover:text-accent transition-colors"
          >
            Archive
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="font-sans text-sm font-medium text-foreground border-b border-border-light pb-3 hover:text-accent transition-colors"
          >
            Contact
          </a>
          <div className="flex items-center gap-3 pt-2 font-medium text-secondary text-sm font-sans">
            <Phone size={18} />
            <span>+201031429229</span>
          </div>
        </div>
      )}
    </nav>
  );
}
