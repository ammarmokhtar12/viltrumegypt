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
      className={`fixed top-0 w-full z-50 transition-all duration-300 font-sans ${
        scrolled
          ? "bg-white shadow-sm py-3"
          : "bg-white py-6"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 uppercase">
        {/* Brand - Left */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold tracking-[0.2rem] text-primary">VILTRUM</span>
            <span className="text-[10px] font-medium tracking-[0.1rem] text-muted">COLLECTION</span>
          </Link>
        </div>

        {/* Links - Center (Desktop) */}
        <div className="hidden lg:flex items-center gap-8 lowercase first-letter:uppercase">
          <Link href="/" className="text-sm font-medium text-foreground hover:text-secondary transition-colors">
            Home
          </Link>
          <Link href="/products" className="text-sm font-medium text-foreground hover:text-secondary transition-colors">
            Products
          </Link>
          <a
             href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
             target="_blank"
             rel="noopener noreferrer"
             className="text-sm font-medium text-foreground hover:text-secondary transition-colors"
          >
            Contact
          </a>
          <Link href="/admin" className="text-sm font-medium text-foreground hover:text-secondary transition-colors">
            Account
          </Link>
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
          <Link href="/login" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-foreground border-b border-gray-50 pb-2">
            {user ? "Dashboard" : "Login"}
          </Link>
          <div className="flex items-center gap-3 pt-4 font-bold text-secondary">
            <Phone size={20} />
            <span>+201031429229</span>
          </div>
        </div>
      )}
    </nav>
  );
}

