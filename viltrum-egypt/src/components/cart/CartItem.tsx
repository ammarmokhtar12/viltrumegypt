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
    <div className="flex gap-4 p-3 rounded-2xl bg-white border border-zinc-200">
      {/* Thumbnail */}
      <div className="relative w-20 h-24 overflow-hidden rounded-xl bg-slate-50 border border-zinc-200 flex-shrink-0">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover "
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100">
            <span className="text-zinc-300 font-bold text-xs uppercase">VILTRUM</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider truncate">
              {item.title}
            </h4>
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest block mt-1">
              Size: {item.size}
            </span>
          </div>
          <button
            onClick={() => removeItem(item.product_id, item.size)}
            className="text-zinc-300 hover:text-red-500 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between pb-1">
          {/* Quantity Controls */}
          <div className="flex items-center rounded-xl border border-zinc-200 bg-slate-50">
            <button
              onClick={() =>
                updateQuantity(item.product_id, item.size, item.quantity - 1)
              }
              className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={10} />
            </button>
            <span className="text-[11px] font-bold text-zinc-900 w-6 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                updateQuantity(item.product_id, item.size, item.quantity + 1)
              }
              className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={10} />
            </button>
          </div>

          <span className="text-sm font-bold text-zinc-900">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
