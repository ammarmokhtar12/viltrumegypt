"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { X, ShoppingBag, ArrowRight, Trash2, Sparkles } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import CartItem from "./CartItem";
import Link from "next/link";
import Image from "next/image";
import { trackTikTokEvent } from "@/lib/tiktok";
import { CartItem as CartItemType } from "@/types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, totalPrice, totalItems, removeBundle } = useCartStore();
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

  const handleCheckoutClick = () => {
    trackTikTokEvent("InitiateCheckout", {
      content_type: "product",
      contents: cartItems.map((item) => ({
        content_id: item.product_id,
        content_type: "product",
        content_name: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      value: cartTotal,
      currency: "EGP",
    });
    onClose();
  };

  // Group items by bundle_id
  const groupedItems: Array<
    | { type: "single"; item: CartItemType }
    | { type: "bundle"; bundleId: string; bundleLabel: string; items: CartItemType[]; price: number }
  > = [];

  const bundlesMap: Record<string, { bundleLabel: string; items: CartItemType[]; price: number }> = {};

  cartItems.forEach((item) => {
    if (item.bundle_id) {
      if (!bundlesMap[item.bundle_id]) {
        bundlesMap[item.bundle_id] = {
          bundleLabel: item.bundle_label || "Bundle Offer",
          items: [],
          price: 0,
        };
      }
      bundlesMap[item.bundle_id].items.push(item);
      bundlesMap[item.bundle_id].price += item.price * item.quantity;
    } else {
      groupedItems.push({ type: "single", item });
    }
  });

  Object.entries(bundlesMap).forEach(([bundleId, data]) => {
    groupedItems.push({
      type: "bundle",
      bundleId,
      bundleLabel: data.bundleLabel,
      items: data.items,
      price: data.price,
    });
  });

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
          <div className="flex items-center justify-between px-8 py-6 border-b border-border-light bg-white">
            <div className="flex items-center gap-3">
               <ShoppingBag size={20} className="text-primary" />
              <h2 className="text-[13px] font-sans font-semibold text-primary uppercase tracking-[0.2em]">
                Your Cart
                {cartCount > 0 && (
                  <span className="ml-2 text-muted font-medium">({cartCount})</span>
                )}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface transition-all active:scale-90"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {groupedItems.length === 0 ? (
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
              groupedItems.map((grouped) => {
                if (grouped.type === "single") {
                  return (
                    <CartItem
                      key={`${grouped.item.product_id}-${grouped.item.size}`}
                      item={grouped.item}
                    />
                  );
                } else {
                  return (
                    <div
                      key={grouped.bundleId}
                      className="p-4 rounded-xl bg-surface border border-border-light space-y-4 shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                      
                      {/* Header */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Sparkles size={12} className="text-primary animate-pulse" />
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-primary">
                            {grouped.bundleLabel}
                          </span>
                        </div>
                        <button
                          onClick={() => removeBundle(grouped.bundleId)}
                          className="text-muted hover:text-red-500 transition-colors p-1"
                          aria-label="Remove bundle"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Items List */}
                      <div className="space-y-3">
                        {grouped.items.map((subItem, index) => (
                          <div key={`${subItem.product_id}-${subItem.size}-${index}`} className="flex gap-3 items-center">
                            <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-white border border-border-light flex-shrink-0">
                              {subItem.image_url ? (
                                <Image
                                  src={subItem.image_url}
                                  alt={subItem.title}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <div className="w-full h-full bg-surface flex items-center justify-center">
                                  <span className="text-[10px] text-muted">V</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-primary truncate">{subItem.title}</p>
                              <span className="text-[10px] text-muted block mt-0.5">Size: {subItem.size}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bundle Price */}
                      <div className="pt-3 border-t border-border-light flex justify-between items-center text-xs font-bold text-primary">
                        <span className="text-[9px] text-muted uppercase tracking-wider font-semibold">Bundle Price:</span>
                        <span>{formatPrice(grouped.price)}</span>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="px-8 py-8 border-t border-border-light bg-white space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted font-medium uppercase tracking-widest">
                  Estimated Total
                </span>
                <span className="text-2xl font-bold text-foreground tabular-nums">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <div className="space-y-3">
                <Link
                  href="/checkout"
                  onClick={handleCheckoutClick}
                  className="btn-primary w-full shadow-lg shadow-black/5 flex items-center justify-center gap-3"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </Link>
                <p className="text-[10px] text-center text-muted uppercase tracking-[0.1em]">
                  Shipping & taxes calculated at checkout
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
