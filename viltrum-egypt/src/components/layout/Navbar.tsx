"use client";

import { ShoppingBag, Menu, X } from "lucide-react";
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
          ? "bg-background border-b border-border-light py-4"
          : "bg-background py-6"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 lg:px-12">
        {/* Desktop Nav - Left */}
        <div className="hidden lg:flex flex-1 items-center gap-10">
          <Link href="/products" className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground hover:opacity-50 transition-opacity">
            Archive
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground hover:opacity-50 transition-opacity"
          >
            Concierge
          </a>
        </div>

        {/* Logo - Center */}
        <div className="flex-1 lg:flex-none flex justify-start lg:justify-center">
          <Link href="/" className="flex flex-col items-start lg:items-center">
            <span className="text-3xl lg:text-4xl font-display font-bold leading-none tracking-tight text-foreground">
              VILTRUM
            </span>
          </Link>
        </div>

        {/* Actions - Right */}
        <div className="flex flex-1 items-center justify-end gap-6">
          {/* Identity */}
          <div className="hidden lg:block">
            {user ? (
              <Link
                href="/admin"
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground hover:opacity-50 transition-opacity"
              >
                {user.user_metadata?.full_name?.split(" ")[0] || "Client"}
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground hover:opacity-50 transition-opacity"
              >
                Client Login
              </Link>
            )}
          </div>

          {/* Cart */}
          <button
            id="cart-button"
            onClick={onCartOpen}
            className="flex items-center gap-2 group"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground group-hover:opacity-50 transition-opacity">
              Cart
            </span>
            <div className="relative">
              <ShoppingBag strokeWidth={1.5} size={20} className="text-foreground" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -bottom-2 flex h-4 w-4 items-center justify-center bg-foreground text-background text-[9px] font-bold">
                  {itemCount}
                </span>
              )}
            </div>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center lg:hidden ml-2"
          >
            {mobileOpen ? <X strokeWidth={1.5} size={24} /> : <Menu strokeWidth={1.5} size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="absolute top-full left-0 w-full h-screen bg-background px-6 pt-10 pb-24 flex flex-col justify-between border-t border-border-light z-40 lg:hidden">
          <div className="flex flex-col gap-8">
            <Link href="/" onClick={() => setMobileOpen(false)} className="text-5xl font-display font-bold text-foreground">
              INDEX
            </Link>
            <Link href="/products" onClick={() => setMobileOpen(false)} className="text-5xl font-display font-bold text-foreground">
              ARCHIVE
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-5xl font-display font-bold text-foreground"
            >
              CONCIERGE
            </a>
          </div>
          
          <div className="border-t border-border-light pt-8">
            {user ? (
               <Link href="/admin" className="text-base font-bold uppercase tracking-widest text-foreground">
                  View Profile
               </Link>
            ) : (
               <Link href="/login" className="text-base font-bold uppercase tracking-widest text-foreground">
                  Client Login
               </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
