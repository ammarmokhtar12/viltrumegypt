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
  const [isBumping, setIsBumping] = useState(false);
  const [prevCount, setPrevCount] = useState(itemCount);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mounted && itemCount > prevCount) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 600);
      setPrevCount(itemCount);
      return () => clearTimeout(timer);
    } else if (itemCount !== prevCount) {
      setPrevCount(itemCount);
    }
  }, [itemCount, prevCount, mounted]);

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
      <div className="eid-banner overflow-hidden py-2.5 border-b border-border-light/50 relative z-50 select-none rgb-shadow">
        <div className="marquee-container flex whitespace-nowrap">
          <div className="marquee-content flex gap-16 text-[10px] font-semibold uppercase tracking-[0.25em] px-4 font-sans">
            <span className="rgb-glow-text">
              VILTRUM ARMORY — COMPRESSION GEAR FORGED FOR HEROES · UNLEASH YOUR INNER VILTRUMITE
            </span>
            <span className="rgb-glow-text">
              VILTRUM ARMORY — COMPRESSION GEAR FORGED FOR HEROES · UNLEASH YOUR INNER VILTRUMITE
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
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201132507383"}`}
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
            <span>+201132507383</span>
          </div>

          <button
            onClick={onCartOpen}
            className={`flex items-center group relative p-1 transition-all ${
              isBumping ? "animate-cart-shake" : ""
            }`}
            aria-label="Open cart"
          >
            <div className="relative">
              <ShoppingBag
                strokeWidth={1.5}
                size={26}
                className={`transition-colors duration-300 ${
                  isBumping ? "text-red-500 fill-red-500/20" : "text-foreground group-hover:text-accent"
                }`}
              />
              {itemCount > 0 && (
                <span className={`absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center text-white text-[10px] font-bold rounded-full font-sans transition-all duration-300 ${
                  isBumping ? "bg-red-500 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-secondary"
                }`}>
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
        <div className="lg:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-t border-border-light shadow-xl px-6 py-8 flex flex-col gap-5 animate-mobile-menu">
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
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201132507383"}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="font-sans text-sm font-medium text-foreground border-b border-border-light pb-3 hover:text-accent transition-colors"
          >
            Contact
          </a>
          <div className="flex items-center gap-3 pt-2 font-medium text-secondary text-sm font-sans">
            <Phone size={18} />
            <span>+201132507383</span>
          </div>
        </div>
      )}
    </nav>
  );
}
