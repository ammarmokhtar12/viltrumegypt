"use client";

import { ShoppingBag, User, Moon, Sun, Menu, X } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/lib/supabase";

interface NavbarProps {
  onCartOpen: () => void;
}

export default function Navbar({ onCartOpen }: NavbarProps) {
  const totalItems = useCartStore((s) => s.totalItems);
  const { user } = useAuthStore();
  const itemCount = totalItems();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      id="main-navbar"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface/80 backdrop-blur-xl border-b border-border-light shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <span className="text-background font-display text-lg">V</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none tracking-[0.2em] text-foreground">
              VILTRUM
            </span>
            <span className="text-[8px] font-medium uppercase tracking-[0.3em] text-muted">
              Egypt
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-[13px] font-medium text-secondary transition-colors hover:text-foreground">
            Home
          </Link>
          <Link href="/products" className="text-[13px] font-medium text-secondary transition-colors hover:text-foreground">
            Shop
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-secondary transition-colors hover:text-foreground"
          >
            Contact
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-all hover:text-foreground hover:bg-surface"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}

          {/* User */}
          {user ? (
            <button
              onClick={() => {
                if (confirm("Logout?")) {
                  supabase.auth.signOut();
                }
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-background text-xs font-bold transition-all hover:opacity-90"
              title="Logout"
            >
              {user.user_metadata?.full_name?.charAt(0).toUpperCase() || "U"}
            </button>
          ) : (
            <Link
              href="/login"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-all hover:text-foreground hover:bg-surface"
              aria-label="Login"
            >
              <User size={17} />
            </Link>
          )}

          {/* Cart */}
          <button
            id="cart-button"
            onClick={onCartOpen}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-all hover:text-foreground hover:bg-surface"
            aria-label="Open cart"
          >
            <ShoppingBag size={17} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-all hover:text-foreground hover:bg-surface md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border-light bg-surface px-5 pb-6 pt-4 md:hidden animate-fade-up">
          <div className="flex flex-col gap-4">
            <Link href="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-secondary transition-colors hover:text-foreground py-2">
              Home
            </Link>
            <Link href="/products" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-secondary transition-colors hover:text-foreground py-2">
              Shop
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-secondary transition-colors hover:text-foreground py-2"
            >
              Contact
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
