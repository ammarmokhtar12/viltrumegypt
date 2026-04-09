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
    <div className="flex gap-4 p-4 glass-card rounded-xl">
      {/* Thumbnail */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-viltrum-gray flex-shrink-0">
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
            <span className="text-viltrum-red font-bold">V</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-bold text-foreground truncate">
              {item.title}
            </h4>
            <span className="text-xs text-foreground/40">
              Size: {item.size}
            </span>
          </div>
          <button
            onClick={() => removeItem(item.product_id, item.size)}
            className="p-1 text-foreground/30 hover:text-viltrum-red transition-colors"
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                updateQuantity(item.product_id, item.size, item.quantity - 1)
              }
              className="w-7 h-7 rounded-lg border border-viltrum-white/10 flex items-center justify-center text-foreground/50 hover:border-viltrum-red hover:text-viltrum-red transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={12} />
            </button>
            <span className="text-sm font-medium text-foreground w-6 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                updateQuantity(item.product_id, item.size, item.quantity + 1)
              }
              className="w-7 h-7 rounded-lg border border-viltrum-white/10 flex items-center justify-center text-foreground/50 hover:border-viltrum-red hover:text-viltrum-red transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={12} />
            </button>
          </div>

          <span className="text-sm font-bold text-viltrum-red">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
