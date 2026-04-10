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
        className={`fixed inset-0 z-[60] bg-primary/20 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-[70] bg-background border-l border-border-light transform transition-transform duration-400 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border-light">
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={18} className="text-foreground" />
              <h2 className="text-base font-semibold text-foreground">
                Cart
                {cartCount > 0 && (
                  <span className="ml-1.5 text-sm text-muted font-normal">({cartCount})</span>
                )}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-14 h-14 bg-surface border border-border-light rounded-xl flex items-center justify-center">
                  <ShoppingBag size={22} className="text-muted" />
                </div>
                <p className="text-sm text-muted font-medium">
                  Your cart is empty
                </p>
                <button
                  onClick={onClose}
                  className="text-sm font-semibold text-accent hover:underline underline-offset-4"
                >
                  Start Shopping
                </button>
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
            <div className="px-6 py-5 border-t border-border-light space-y-4 bg-surface">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary font-medium">
                  Total
                </span>
                <span className="text-xl font-bold text-foreground">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="btn-primary w-full"
              >
                Checkout
                <ArrowRight size={15} className="ml-2" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
