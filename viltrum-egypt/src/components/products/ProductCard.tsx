"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
import gsap from "gsap";

interface ProductCardProps {
  product: Product;
}

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function ProductCard({ product }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        boxShadow: "0 0 50px rgba(178, 0, 0, 0.2), 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(178, 0, 0, 0.08)",
        borderColor: "rgba(178, 0, 0, 0.25)",
        y: -6,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        boxShadow: "0 0 0 rgba(178, 0, 0, 0), 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 rgba(178, 0, 0, 0)",
        borderColor: "rgba(240, 240, 240, 0.06)",
        y: 0,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, []);

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

    // Button animation
    if (cardRef.current) {
      const btn = cardRef.current.querySelector("[data-add-btn]");
      if (btn) {
        gsap.fromTo(btn, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: "back.out(1.7)" });
      }
    }

    setTimeout(() => setAdded(false), 1800);
  };

  const availableSizes = product.sizes || SIZES;

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "rgba(18, 18, 18, 0.95)",
        border: "1px solid rgba(240, 240, 240, 0.06)",
      }}
    >
      {/* Product Image — 4:5 Aspect Ratio */}
      <div className="relative overflow-hidden bg-viltrum-gray" style={{ aspectRatio: "4/5" }}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-viltrum-gray to-viltrum-gray-light">
            <div className="w-20 h-20 rounded-full bg-viltrum-red/10 flex items-center justify-center">
              <span className="text-viltrum-red font-display font-black text-3xl">V</span>
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60" />

        {/* Price tag floating on image */}
        <div className="absolute bottom-4 left-4 z-10">
          <span className="text-2xl font-black text-white drop-shadow-lg font-display">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6 space-y-5">
        {/* Title */}
        <div>
          <h3 className="text-base font-bold text-viltrum-white tracking-wide leading-tight font-display">
            {product.title}
          </h3>
          {product.description && (
            <p className="text-[13px] text-viltrum-mist/50 mt-2 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Size Selector (Hidden until hover) */}
        <div className="grid transition-all duration-[400ms] grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 overflow-hidden">
          <div className="space-y-3 min-h-0">
            <span className="block text-[10px] tracking-[0.2em] text-viltrum-mist/40 uppercase font-semibold">
              Select Size
            </span>
            <div className="flex gap-2 flex-wrap pb-1">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`armor-ghost-btn px-4 py-2 text-xs font-semibold ${
                    selectedSize === size
                      ? "!border-viltrum-red !text-viltrum-white !bg-viltrum-red/10 !shadow-[0_0_15px_rgba(178,0,0,0.3)]"
                      : ""
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          data-add-btn
          id={`add-to-cart-${product.id}`}
          onClick={handleAddToCart}
          disabled={!selectedSize || added}
          className={`armor-btn w-full py-4 px-4 font-bold text-[13px] tracking-[0.15em] uppercase flex items-center justify-center gap-2.5 ${
            added
              ? "!bg-green-600/90 !text-white !border-green-500 !shadow-[0_0_20px_rgba(34,197,94,0.2)]"
              : !selectedSize
              ? "!bg-viltrum-gray-light/60 !text-viltrum-mist/25 !border-transparent cursor-not-allowed !shadow-none"
              : ""
          }`}
        >
          {added ? (
            <>
              <Check size={16} />
              Added!
            </>
          ) : (
            <>
              <ShoppingBag size={15} />
              {selectedSize ? "Add to Cart" : "Select Size"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
