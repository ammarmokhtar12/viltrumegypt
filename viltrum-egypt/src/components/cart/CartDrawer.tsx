"use client";

import { useEffect, useRef, useState } from "react";
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
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

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
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-[70] bg-viltrum-black border-l border-viltrum-white/5 transform transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-viltrum-white/5">
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} className="text-viltrum-red" />
              <h2 className="text-lg font-bold tracking-widest text-viltrum-white">
                CART
              </h2>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-viltrum-red/20 text-viltrum-red rounded-full">
                  {cartCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-viltrum-white/50 hover:text-viltrum-white transition-colors"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-viltrum-gray flex items-center justify-center">
                  <ShoppingBag
                    size={32}
                    className="text-viltrum-white/20"
                  />
                </div>
                <p className="text-viltrum-white/40 text-sm">
                  Your cart is empty
                </p>
                <button
                  onClick={onClose}
                  className="text-sm text-viltrum-red hover:text-viltrum-red-light transition-colors"
                >
                  Continue Shopping
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
            <div className="p-5 border-t border-viltrum-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-viltrum-white/50 tracking-widest uppercase">
                  Total
                </span>
                <span className="text-2xl font-black text-viltrum-red">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full py-4 bg-viltrum-red text-white font-bold text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-viltrum-red-light transition-colors duration-300 active:scale-95"
              >
                Checkout
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
