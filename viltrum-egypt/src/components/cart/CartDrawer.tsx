"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import CartItem from "./CartItem";
import Link from "next/link";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, totalPrice, totalItems } = useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isHydrated) return null;

  const cartItems = items;
  const cartTotal = totalPrice();
  const cartCount = totalItems();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/80 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-[70] bg-background border-l border-viltrum-white/5 transform transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-border-color">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingBag size={24} className="text-viltrum-red" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-viltrum-red text-[10px] font-black text-white shadow-[0_4px_12px_rgba(139,0,0,0.4)]">
                    {cartCount}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold tracking-[0.2em] text-foreground uppercase">
                Cart
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-foreground/[0.03] text-foreground/40 hover:text-foreground transition-all duration-300 border border-border-color"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                <div className="w-24 h-24 rounded-3xl bg-foreground/[0.03] border border-border-color flex items-center justify-center">
                  <ShoppingBag
                    size={40}
                    className="text-foreground/10"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-foreground/40 text-xs font-black uppercase tracking-widest">
                    Empty Inventory
                  </p>
                  <button
                    onClick={onClose}
                    className="text-sm text-viltrum-red font-bold uppercase tracking-widest hover:text-viltrum-red-light transition-colors"
                  >
                    Return to Drops
                  </button>
                </div>
              </div>
            ) : (
              cartItems.map((item) => (
                <CartItem
                  key={`${item.product_id}-${item.size}`}
                  item={item}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="p-8 border-t border-border-color space-y-8 bg-foreground/[0.01]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/40 font-black tracking-widest uppercase">
                  Total Value
                </span>
                <span className="text-3xl font-black text-viltrum-red">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="armor-btn w-full !h-16 text-sm"
              >
                Go To Checkout
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
