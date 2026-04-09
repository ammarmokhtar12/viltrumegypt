"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function ProductCard({ product }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem({
      product_id: product.id,
      title: product.title,
      price: product.price,
      size: selectedSize,
      quantity: 1,
      image_url: product.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const availableSizes = product.sizes || SIZES;

  return (
    <div className="group flex flex-col bg-white">
      {/* Product Image — 4:5 Aspect Ratio */}
      <div className="relative overflow-hidden bg-zinc-100" style={{ aspectRatio: "4/5" }}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 mix-blend-multiply"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100">
            <span className="text-zinc-300 font-display font-bold text-4xl">VILTRUM</span>
          </div>
        )}

        <div className="absolute left-4 top-4 z-10">
          <span className="bg-white/90 text-zinc-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm shadow-sm">
            Premium Drop
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="pt-6 pb-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2 gap-4">
          <h3 className="font-display text-3xl leading-none tracking-wide text-zinc-900">
            {product.title}
          </h3>
          <span className="font-display text-2xl leading-none text-zinc-900 shrink-0">
            {formatPrice(product.price)}
          </span>
        </div>
        
        {product.description && (
          <p className="line-clamp-2 text-sm text-zinc-500 mb-6 flex-1">
            {product.description}
          </p>
        )}

        {/* Size Selector */}
        <div className="space-y-3 mb-6">
          <span className="block text-[10px] tracking-widest text-zinc-400 uppercase font-bold">
            Select Size
          </span>
          <div className="flex gap-2 flex-wrap">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`h-10 px-4 text-xs font-bold transition-colors ${
                  selectedSize === size
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!selectedSize || added}
          className={`h-12 w-full flex items-center justify-center gap-2 text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
            added
              ? "bg-emerald-600 text-white"
              : !selectedSize
              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              : "bg-zinc-900 text-white hover:bg-zinc-700"
          }`}
        >
          {added ? (
            <>
              <Check size={16} />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag size={16} />
              {selectedSize ? "Add To Cart" : "Select Size"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
