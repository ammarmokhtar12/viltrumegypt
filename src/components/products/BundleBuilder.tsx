"use client";

// --- VILTRUM BUNDLE BUILDER V2 (RESTRUCTURED) ---
// This component handles the core logic for the 850 EGP and 1200 EGP bundles.

import { useState, useEffect } from "react";
import Image from "next/image";
import { Check, Plus, ShoppingBag, AlertCircle, RefreshCw, X } from "lucide-react";
import { Product, CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { trackTikTokEvent } from "@/lib/tiktok";

interface BundleBuilderProps {
  limitedOfferProduct: Product;
  onCartOpen: () => void;
}

interface SelectedSlot {
  product: Product | null;
  size: string;
}

export default function BundleBuilder({ limitedOfferProduct, onCartOpen }: BundleBuilderProps) {
  const addBundle = useCartStore((s) => s.addBundle);

  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Bundle Configuration State
  const [tier, setTier] = useState<2 | 3>(2);
  const [slots, setSlots] = useState<SelectedSlot[]>([
    { product: null, size: "" },
    { product: null, size: "" },
  ]);
  
  // Modal State for Product Selection
  const [activeSelectIndex, setActiveSelectIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch products and inventory
  useEffect(() => {
    async function fetchBundleData() {
      setLoading(true);
      try {
        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (prodError) throw prodError;

        // Hide "LIMITED OFFER" from the selection choices
        const filteredProducts = (prodData || []).filter(
          (p: Product) => p.title.toUpperCase() !== "LIMITED OFFER"
        );
        setProducts(filteredProducts);

        const { data: invData, error: invError } = await supabase
          .from("inventory")
          .select("product_id, size, quantity");

        if (invError) throw invError;

        const stockMap: Record<string, number> = {};
        (invData || []).forEach((row: any) => {
          stockMap[`${row.product_id}_${row.size}`] = row.quantity;
        });
        setInventory(stockMap);
      } catch (err) {
        console.error("Error fetching bundle products:", err);
        toast.error("Failed to load products for bundle builder.");
      } finally {
        setLoading(false);
      }
    }

    fetchBundleData();
  }, []);

  // Update slots when tier changes
  const handleTierChange = (newTier: 2 | 3) => {
    setTier(newTier);
    if (newTier === 2) {
      setSlots((prev) => prev.slice(0, 2));
    } else {
      setSlots((prev) => {
        const next = [...prev];
        while (next.length < 3) {
          next.push({ product: null, size: "" });
        }
        return next;
      });
    }
  };

  // Calculate remaining stock across all chosen slots
  const getAvailableStock = (productId: string, size: string, currentSlotIdx: number) => {
    const key = `${productId}_${size}`;
    const totalStock = inventory[key] || 0;

    let usedStock = 0;
    slots.forEach((slot, idx) => {
      if (idx !== currentSlotIdx && slot.product?.id === productId && slot.size === size) {
        usedStock++;
      }
    });

    return Math.max(0, totalStock - usedStock);
  };

  // Helper: detect long sleeve
  const isLongSleeve = (product: Product) =>
    product.title.toLowerCase().includes("long");

  // Select Product for a specific slot
  const handleSelectProduct = (slotIdx: number, product: Product) => {
    // Enforcement: Only 1 Long Sleeve allowed
    if (isLongSleeve(product)) {
      const hasLongSleeve = slots.some(
        (s, i) => i !== slotIdx && s.product && isLongSleeve(s.product)
      );
      if (hasLongSleeve) return; // Prevent selection
    }

    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { product, size: "" };
      return next;
    });
    setActiveSelectIndex(null); // Close the modal

    trackTikTokEvent("ViewContent", {
      content_type: "product",
      content_id: product.id,
      content_name: product.title,
      value: product.price,
      currency: "EGP",
    });
  };

  // Set Size for a slot
  const handleSelectSize = (slotIdx: number, size: string) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], size };
      return next;
    });
  };

  const handleClearSlot = (slotIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { product: null, size: "" };
      return next;
    });
  };

  const isBundleComplete = slots.every((s) => s.product && s.size);

  // Core Pricing Logic
  const bundlePrice = tier === 2 ? 850 : 1200;
  const originalPriceSum = slots.reduce((sum, s) => sum + (s.product?.price || 500), 0);
  const discountAmount = Math.max(0, originalPriceSum - bundlePrice);

  const handleAddToCart = () => {
    if (!isBundleComplete) {
      toast.error("Please complete your bundle by selecting all products and sizes.");
      return;
    }

    setIsAdding(true);

    const longSleeveCount = slots.filter(s => s.product && isLongSleeve(s.product)).length;
    if (longSleeveCount > 1) {
      toast.error("You can only include 1 Long Sleeve per bundle.");
      setIsAdding(false);
      return;
    }

    const bundleItems: CartItem[] = slots.map((s) => ({
      product_id: s.product!.id,
      title: s.product!.title,
      price: s.product!.price,
      size: s.size,
      quantity: 1,
      image_url: s.product!.image_url,
    }));

    const label = `Viltrum ${tier}-Shirt Bundle`;
    addBundle(bundleItems, bundlePrice, label);

    toast.success("Bundle added to cart!");
    
    trackTikTokEvent("AddToCart", {
      content_type: "product",
      content_id: limitedOfferProduct.id,
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

    setIsAdding(false);
    onCartOpen();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Loading Archive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Banner */}
      <div className="bg-primary text-white border border-primary/20 p-6 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="space-y-1.5 z-10 text-center relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">Viltrum Bundle Builder</p>
          <p className="text-lg font-serif text-white tracking-wide">Build your custom compression armor set</p>
          <p className="text-[11px] text-white/60">Choose any T-shirts from our active inventory.</p>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="space-y-6">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md uppercase tracking-wider">Step 1</span>
          <h2 className="text-2xl font-serif text-foreground">Select Bundle Pack</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleTierChange(2)}
            className={`relative p-6 rounded-2xl border text-left transition-all duration-400 group overflow-hidden ${
              tier === 2
                ? "border-primary bg-primary/[0.02] shadow-xl scale-[1.01]"
                : "border-border-light bg-surface hover:border-muted hover:bg-white"
            }`}
          >
            {tier === 2 && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                <Check size={14} strokeWidth={2.5} />
              </div>
            )}
            <div className="space-y-2">
              <span className="inline-block text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Value Pack</span>
              <h3 className="text-xl font-serif font-bold text-foreground">Double Compression Pack</h3>
              <p className="text-xs text-secondary leading-relaxed">Choose any 2 premium T-shirts with mixed sizes.</p>
              
              <div className="pt-4 flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-primary">850 EGP</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest">Save 200 EGP</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleTierChange(3)}
            className={`relative p-6 rounded-2xl border text-left transition-all duration-400 group overflow-hidden ${
              tier === 3
                ? "border-primary bg-primary/[0.02] shadow-xl scale-[1.01]"
                : "border-border-light bg-surface hover:border-muted hover:bg-white"
            }`}
          >
            {tier === 3 && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                <Check size={14} strokeWidth={2.5} />
              </div>
            )}
            <div className="space-y-2">
              <span className="inline-block text-[9px] font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Popular Pack</span>
              <h3 className="text-xl font-serif font-bold text-foreground">Triple Compression Pack</h3>
              <p className="text-xs text-secondary leading-relaxed">Choose any 3 premium T-shirts with custom sizes.</p>

              <div className="pt-4 flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-primary">1,200 EGP</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest">Save 300 EGP</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Slots Selection */}
      <div className="space-y-6">
        <div className="flex justify-between items-baseline">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md uppercase tracking-wider">Step 2</span>
            <h2 className="text-2xl font-serif text-foreground">Configure T-Shirts</h2>
          </div>
          <span className="text-xs text-muted uppercase tracking-widest font-semibold">
            {slots.filter((s) => s.product && s.size).length} of {tier} Configured
          </span>
        </div>

        <div className={`grid grid-cols-1 gap-6 ${tier === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
          {slots.map((slot, index) => {
            const hasProduct = !!slot.product;

            return (
              <div
                key={index}
                onClick={() => !hasProduct && setActiveSelectIndex(index)}
                className={`relative rounded-2xl border p-5 transition-all duration-400 flex flex-col justify-between min-h-[240px] ${
                  hasProduct
                    ? "border-primary bg-white ring-1 ring-primary/5 shadow-sm"
                    : "border-border-light bg-surface hover:border-muted hover:bg-white cursor-pointer hover:shadow-md"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-primary text-white`}>
                    Slot {index + 1}
                  </span>
                  
                  {hasProduct && (
                    <button
                      onClick={(e) => handleClearSlot(index, e)}
                      className="text-muted hover:text-red-500 p-1.5 rounded-full hover:bg-black/5 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {slot.product ? (
                  <div className="flex gap-4 items-start flex-1">
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-white border border-border-light flex-shrink-0">
                      {slot.product.image_url && (
                        <Image src={slot.product.image_url} alt={slot.product.title} fill className="object-cover" sizes="64px" />
                      )}
                    </div>
                    <div className="space-y-3 flex-1 min-w-0">
                      <div>
                        <h4 className="text-sm font-semibold text-primary truncate leading-tight">{slot.product.title}</h4>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted block">Select Size:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {slot.product.sizes?.map((sz) => {
                            const availableStock = getAvailableStock(slot.product!.id, sz, index);
                            const isOutOfStock = availableStock <= 0;
                            return (
                              <button
                                key={sz}
                                disabled={isOutOfStock}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSize(index, sz);
                                }}
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                                  slot.size === sz
                                    ? "bg-primary text-white border-primary shadow-sm"
                                    : isOutOfStock
                                    ? "bg-surface border-border-light text-muted/30 cursor-not-allowed line-through"
                                    : "bg-white border-border-light hover:border-secondary"
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-muted/30 rounded-xl bg-white/50">
                    <Plus size={20} className="text-muted/60 mb-2" />
                    <p className="text-xs font-semibold text-primary">Select T-Shirt</p>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-border-light flex justify-between items-center text-[10px] font-semibold tracking-wider uppercase">
                  <span className="text-muted">Status:</span>
                  {slot.product ? (
                    slot.size ? (
                      <span className="text-emerald-600 flex items-center gap-1 font-extrabold">
                        <Check size={10} strokeWidth={3} /> Configured ({slot.size})
                      </span>
                    ) : (
                      <span className="text-amber-600 animate-pulse font-extrabold">Needs Size Selection</span>
                    )
                  ) : (
                    <span className="text-muted font-bold">Unselected</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catalog Selector Modal */}
      {activeSelectIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-border-light">
            <div className="px-6 py-5 border-b border-border-light flex justify-between items-center bg-surface">
              <h3 className="text-lg font-serif font-bold text-primary">Choose T-Shirt for Slot {activeSelectIndex + 1}</h3>
              <button
                onClick={() => setActiveSelectIndex(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-border-light hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => {
                const hasSizesAvailable = p.sizes?.some((sz) => getAvailableStock(p.id, sz, activeSelectIndex) > 0);
                const wouldViolateLongSleeveRule = isLongSleeve(p) && slots.some((s, i) => i !== activeSelectIndex && s.product && isLongSleeve(s.product));
                const isDisabled = !hasSizesAvailable || wouldViolateLongSleeveRule;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isDisabled && handleSelectProduct(activeSelectIndex, p)}
                    className={`group relative flex flex-col bg-surface rounded-2xl border p-3 transition-all ${
                      wouldViolateLongSleeveRule
                        ? "cursor-not-allowed border-border-light"
                        : !hasSizesAvailable
                        ? "opacity-40 grayscale cursor-not-allowed border-border-light"
                        : "cursor-pointer hover:border-muted hover:bg-white hover:shadow-md"
                    }`}
                  >
                    <div className="relative aspect-[4/5] bg-white rounded-xl overflow-hidden mb-3">
                      {p.image_url && <Image src={p.image_url} alt={p.title} fill className="object-cover" sizes="20vw" />}
                      
                      {wouldViolateLongSleeveRule && (
                        <div className="absolute inset-0 backdrop-blur-md bg-black/50 flex flex-col items-center justify-center gap-2 rounded-xl text-center px-2">
                          <span className="text-white text-[9px] font-extrabold uppercase tracking-widest leading-snug">Max 1 Long Sleeve</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-serif font-bold text-primary uppercase truncate">{p.title}</h4>
                      <p className="text-[10px] font-bold text-secondary">{formatPrice(p.price)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cart Summary */}
      <div className="border-t border-border-light bg-surface p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Summary</p>
          <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
            <span className="text-xl font-bold text-primary">{formatPrice(bundlePrice)}</span>
            {isBundleComplete && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                Saved {formatPrice(discountAmount)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`w-full md:w-auto min-w-[280px] h-16 flex items-center justify-center gap-3 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 shadow-xl ${
            isBundleComplete
              ? "bg-primary text-white hover:opacity-95 shadow-primary/10 hover:shadow-primary/20 scale-[1.02] cursor-pointer"
              : "bg-surface border border-border-light text-muted/60 cursor-pointer"
          }`}
        >
          {isAdding ? <RefreshCw className="h-4 w-4 animate-spin" /> : isBundleComplete ? <><ShoppingBag size={16} /> Add Bundle To Cart</> : <><AlertCircle size={16} /> Complete Selection</>}
        </button>
      </div>
    </div>
  );
}
