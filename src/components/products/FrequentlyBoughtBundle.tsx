"use client";

import { useState, useMemo } from "react";
import ProductImage from "@/components/products/ProductImage";
import { Product, CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";
import { trackTikTokEvent } from "@/lib/tiktok";
import { trackMetaEvent } from "@/lib/meta";
import { sortProductsWithBestSellers } from "@/lib/productSorting";
import { Plus, Check, ShoppingBag } from "lucide-react";

interface FrequentlyBoughtBundleProps {
  currentProduct: Product;
  allProducts: Product[];
  currentSelectedSize: string;
  onCartOpen: () => void;
}

export default function FrequentlyBoughtBundle({
  currentProduct,
  allProducts,
  currentSelectedSize,
  onCartOpen,
}: FrequentlyBoughtBundleProps) {
  const addBundle = useCartStore((s) => s.addBundle);

  // Eligible secondary products (exclude current and limited offer)
  const availableOthers = useMemo(() => {
    const list = (allProducts || []).filter(
      (p) =>
        p.id !== currentProduct.id &&
        p.title.toUpperCase() !== "LIMITED OFFER" &&
        p.is_active !== false
    );
    return sortProductsWithBestSellers(list);
  }, [allProducts, currentProduct.id]);

  // Default secondary product: the first sorted product
  const [secondaryProduct, setSecondaryProduct] = useState<Product | null>(() => {
    return availableOthers[0] || null;
  });

  // Sizes for both
  const [size1, setSize1] = useState<string>(currentSelectedSize || "L");
  const [size2, setSize2] = useState<string>("L");
  const [isAdding, setIsAdding] = useState(false);

  // Keep size1 in sync if user changes size on main product
  const effectiveSize1 = currentSelectedSize || size1;

  if (!secondaryProduct || availableOthers.length === 0) {
    return null;
  }

  const sizes1 = currentProduct.sizes || ["S", "M", "L", "XL", "XXL"];
  const sizes2 = secondaryProduct.sizes || ["S", "M", "L", "XL", "XXL"];

  const regularTotal = (currentProduct.price || 480) + (secondaryProduct.price || 480);
  const bundlePrice = 850;
  const savings = Math.max(0, regularTotal - bundlePrice);

  const handleAddBundle = () => {
    if (!effectiveSize1) {
      toast.error("يرجى اختيار مقاس التيشرت الأول");
      return;
    }
    if (!size2) {
      toast.error("يرجى اختيار مقاس التيشرت الثاني");
      return;
    }

    setIsAdding(true);

    const bundleItems: CartItem[] = [
      {
        product_id: currentProduct.id,
        title: currentProduct.title,
        price: currentProduct.price,
        size: effectiveSize1,
        quantity: 1,
        image_url: currentProduct.image_url,
      },
      {
        product_id: secondaryProduct.id,
        title: secondaryProduct.title,
        price: secondaryProduct.price,
        size: size2,
        quantity: 1,
        image_url: secondaryProduct.image_url,
      },
    ];

    const label = "Viltrum 2-Shirt Bundle";
    addBundle(bundleItems, bundlePrice, label);

    toast.success("تمت إضافة عرض الـ 2 تيشرت بـ 850 ج بنجاح! 🎉", {
      description: `وفرت ${savings} جنيه مصري`,
    });

    trackTikTokEvent("AddToCart", {
      content_type: "product",
      content_id: "bundle_2_shirts",
      content_name: label,
      value: bundlePrice,
      currency: "EGP",
      contents: bundleItems.map((item) => ({
        content_id: item.product_id,
        content_type: "product",
        content_name: item.title,
        quantity: 1,
        price: item.price,
      })),
    });

    trackMetaEvent("AddToCart", {
      content_type: "product",
      content_ids: bundleItems.map((item) => item.product_id),
      content_name: label,
      value: bundlePrice,
      currency: "EGP",
      contents: bundleItems.map((item) => ({ id: item.product_id, quantity: 1, item_price: item.price })),
      num_items: bundleItems.length,
    });

    setIsAdding(false);
    onCartOpen();
  };

  return (
    <div className="relative mt-8 rounded-2xl p-5 sm:p-6 bg-zinc-900 border border-zinc-800 overflow-hidden">

      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          عرض خاص — 2 بـ 850 ج
        </span>
        <span className="text-[10px] sm:text-xs font-medium text-emerald-400">
          وفر {savings} ج.م
        </span>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white mb-1">
        اشتري 2 تيشرت بـ 850 ج فقط
      </h3>
      <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
        وفر 110 جنيه عند إضافة تيشرت آخر — اختار أي تيشرت تاني ومقاسك وهيضافوا كباندل بـ 850 ج بدلاً من {formatPrice(regularTotal)}:
      </p>

      {/* Product Pair Cards */}
      <div className="grid grid-cols-11 gap-2 sm:gap-3 items-center mb-5">
        {/* Item 1: Current Product */}
        <div className="col-span-5 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-3 flex flex-col gap-2">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700/40">
            {currentProduct.image_url ? (
              <ProductImage
                src={currentProduct.image_url}
                alt={currentProduct.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 40vw, 20vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">No Image</div>
            )}
            <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-md text-[8px] font-bold text-white px-2 py-0.5 rounded-md">
              القطعة 1
            </span>
          </div>
          <p className="text-[11px] font-bold text-white truncate">{currentProduct.title}</p>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-zinc-400 font-semibold">المقاس:</span>
            <select
              value={effectiveSize1}
              onChange={(e) => setSize1(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {sizes1.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Plus Divider */}
        <div className="col-span-1 flex items-center justify-center">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center">
            <Plus size={16} strokeWidth={3} />
          </div>
        </div>

        {/* Item 2: Selected Secondary Product */}
        <div className="col-span-5 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-3 flex flex-col gap-2">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700/40">
            {secondaryProduct.image_url ? (
              <ProductImage
                src={secondaryProduct.image_url}
                alt={secondaryProduct.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 40vw, 20vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">No Image</div>
            )}
            <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-md text-[8px] font-bold text-white px-2 py-0.5 rounded-md">
              القطعة 2
            </span>
          </div>

          {/* Change Product Dropdown */}
          <select
            value={secondaryProduct.id}
            onChange={(e) => {
              const found = availableOthers.find((p) => p.id === e.target.value);
              if (found) setSecondaryProduct(found);
            }}
            className="bg-zinc-900 border border-zinc-700 text-white text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400 truncate cursor-pointer w-full"
          >
            {availableOthers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-zinc-400 font-semibold">المقاس:</span>
            <select
              value={size2}
              onChange={(e) => setSize2(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {sizes2.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pricing and Action CTA */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">سعر العرض للقطعتين</p>
          <div className="flex items-baseline justify-center sm:justify-start gap-2.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-bold text-white">850 EGP</span>
            <span className="text-sm font-bold text-zinc-500 line-through">{formatPrice(regularTotal)}</span>
          </div>
        </div>

        <button
          onClick={handleAddBundle}
          disabled={isAdding}
          className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <ShoppingBag size={16} />
          <span>أضف العرض للكارت (2 بـ 850 ج)</span>
        </button>
      </div>
    </div>
  );
}
