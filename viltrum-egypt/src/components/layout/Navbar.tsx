"use client";

import { ShoppingBag, User, Moon, Sun } from "lucide-react";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav id="main-navbar" className="sticky top-0 z-50 border-b border-zinc-200/90 bg-slate-50/60 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xl font-extrabold leading-none tracking-[0.18em] text-zinc-900 sm:text-2xl">
              VILTRUM
            </span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.35em] text-zinc-600">
              Egypt
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 transition-colors hover:text-zinc-900">
              Home
            </Link>
            <Link href="/products" className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 transition-colors hover:text-zinc-900">
              Products
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Contact
            </a>
          </div>
          {user ? (
            <button
              onClick={() => {
                if (confirm("Logout?")) {
                  supabase.auth.signOut();
                }
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700"
              title="Logout"
            >
              <span className="text-xs font-bold">
                {user.user_metadata?.full_name?.charAt(0).toUpperCase() || "U"}
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-600 transition-colors hover:text-zinc-900"
              aria-label="Login"
            >
              <User size={18} />
            </Link>
          )}
          <button
            id="cart-button"
            onClick={onCartOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-600 transition-colors hover:text-zinc-900"
            aria-label="Open cart"
          >
            <ShoppingBag size={18} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-background">
                {itemCount}
              </span>
            )}
          </button>
          
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground transition-colors hover:bg-secondary border border-border-light ml-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
