"use client";

import { ShoppingBag, User } from "lucide-react";
import Link from "next/link";
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

  return (
    <nav id="main-navbar" className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xl font-extrabold leading-none tracking-[0.18em] text-white sm:text-2xl">
              VILTRUM
            </span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.35em] text-zinc-400">
              Egypt
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-white">
              Home
            </Link>
            <Link href="/products" className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-white">
              Products
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-white"
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
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition-colors hover:text-white"
              aria-label="Login"
            >
              <User size={18} />
            </Link>
          )}
          <button
            id="cart-button"
            onClick={onCartOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition-colors hover:text-white"
            aria-label="Open cart"
          >
            <ShoppingBag size={18} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
