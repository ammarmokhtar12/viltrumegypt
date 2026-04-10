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
        className={`fixed inset-0 z-[60] bg-slate-50/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] z-[70] bg-slate-50 border-l border-zinc-200 transform transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full uppercase font-sans">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-zinc-200">
            <div className="flex items-center gap-3">
               <ShoppingBag size={20} className="text-zinc-900" />
               <h2 className="text-lg font-bold tracking-widest text-zinc-900">
                Cart ({cartCount})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 bg-white border border-zinc-200 flex items-center justify-center">
                  <ShoppingBag size={24} className="text-zinc-600" />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] text-zinc-600 font-bold tracking-widest">
                    Your cart is empty
                  </p>
                  <button
                    onClick={onClose}
                    className="text-[10px] font-bold tracking-widest text-zinc-900"
                  >
                    Start Shopping
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
            <div className="p-8 border-t border-zinc-200 space-y-8 bg-white/90">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-bold tracking-widest">
                  Total
                </span>
                <span className="text-2xl font-bold text-zinc-900">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="btn-primary w-full"
              >
                Proceed To Checkout
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
