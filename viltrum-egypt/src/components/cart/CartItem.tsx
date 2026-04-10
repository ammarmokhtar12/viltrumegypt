"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCartStore();

  return (
    <div className="flex gap-4 p-3 rounded-xl bg-surface border border-border-light">
      {/* Thumbnail */}
      <div className="relative w-20 h-24 overflow-hidden rounded-lg bg-background flex-shrink-0">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted/30 font-display text-xl">V</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h4 className="text-sm font-semibold text-foreground truncate">
              {item.title}
            </h4>
            <span className="text-[11px] text-muted block mt-0.5">
              Size: {item.size}
            </span>
          </div>
          <button
            onClick={() => removeItem(item.product_id, item.size)}
            className="text-muted hover:text-red-500 transition-colors p-1 -m-1"
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center rounded-lg border border-border-light bg-background">
            <button
              onClick={() =>
                updateQuantity(item.product_id, item.size, item.quantity - 1)
              }
              className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={12} />
            </button>
            <span className="text-xs font-semibold text-foreground w-7 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                updateQuantity(item.product_id, item.size, item.quantity + 1)
              }
              className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={12} />
            </button>
          </div>

          <span className="text-sm font-bold text-foreground">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
