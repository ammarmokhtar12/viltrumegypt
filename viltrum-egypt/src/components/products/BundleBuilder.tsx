"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Check, Plus, ShoppingBag, Sparkles, AlertCircle, RefreshCw, X } from "lucide-react";
import { Product, CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { trackTikTokEvent } from "@/lib/tiktok";
import { useCountdown } from "@/lib/useCountdown";

interface BundleBuilderProps {
  limitedOfferProduct: Product;
  onCartOpen: () => void;
}

interface SelectedSlot {
  product: Product | null;
  size: string;
}

export default function BundleBuilder({ limitedOfferProduct, onCartOpen }: BundleBuilderProps) {
  const timeLeft = useCountdown();
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
    async function fetchData() {
      setLoading(true);
      try {
        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (prodError) throw prodError;

        const filtered = (prodData || []).filter(
          (p: Product) => p.title.toUpperCase() !== "LIMITED OFFER"
        );
        setProducts(filtered);

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
        console.error("Error fetching bundle builder data:", err);
        toast.error("Failed to load products for bundle builder.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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

  // Helper to calculate available stock in a slot (subtracting other slots' selections)
  const getAvailableStock = (productId: string, size: string, slotIdx: number) => {
    const key = `${productId}_${size}`;
    const totalStock = inventory[key] || 0;

    let selectedElsewhere = 0;
    slots.forEach((s, i) => {
      if (i !== slotIdx && s.product?.id === productId && s.size === size) {
        selectedElsewhere++;
      }
    });

    return Math.max(0, totalStock - selectedElsewhere);
  };

  // Assign product to the slot index
  const handleSelectProduct = (slotIdx: number, product: Product) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { product, size: "" }; // Clear size when changing product
      return next;
    });
    setActiveSelectIndex(null); // Close modal

    // Track ViewContent for the chosen product
    trackTikTokEvent("ViewContent", {
      content_type: "product",
      content_id: product.id,
      content_name: product.title,
      value: product.price,
      currency: "EGP",
    });
  };

  // Set size for a slot
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

  // Check if everything is selected
  const isBundleComplete = slots.every((s) => s.product && s.size);

  const bundlePrice = tier === 2 ? 799 : 1150;
  const originalPriceSum = slots.reduce((sum, s) => sum + (s.product?.price || 499), 0);
  const discountAmount = Math.max(0, originalPriceSum - bundlePrice);

  const handleAddToCart = () => {
    if (!isBundleComplete) {
      // Find missing slots and provide explicit feedback
      const missingDetails: string[] = [];
      slots.forEach((s, idx) => {
        if (!s.product) {
          missingDetails.push(`اختيار تيشرت في الخانة رقم ${idx + 1}`);
        } else if (!s.size) {
          missingDetails.push(`تحديد المقاس للتيشرت في الخانة رقم ${idx + 1}`);
        }
      });

      toast.error("برجاء إكمال الباقة أولاً:", {
        description: missingDetails.join(" و "),
        duration: 5000
      });
      return;
    }

    setIsAdding(true);

    const bundleItems: CartItem[] = slots.map((s) => ({
      product_id: s.product!.id,
      title: s.product!.title,
      price: s.product!.price,
      size: s.size,
      quantity: 1,
      image_url: s.product!.image_url,
    }));

    const label = `${tier}-Shirt Bundle Offer`;
    addBundle(bundleItems, bundlePrice, label);

    toast.success("تم إضافة الباقة بنجاح إلى العربة!");
    
    trackTikTokEvent("AddToCart", {
      content_type: "product",
      content_id: limitedOfferProduct.id,
      content_name: `${tier}-Shirt Bundle (Limited Offer)`,
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
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Configuring Arsenal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* 24h Countdown Banner */}
      <div className="bg-primary text-white border border-primary/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="space-y-1.5 z-10 text-center md:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80 flex items-center gap-2 justify-center md:justify-start">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            Limited Offer Bundle Builder
          </p>
          <p className="text-lg font-serif text-white tracking-wide">Build your custom compression armor set</p>
          <p className="text-[11px] text-white/60">Choose any T-shirts from our active inventory. Automatically repeats daily.</p>
        </div>
        
        {/* Countdown timer */}
        <div className="flex items-center gap-2 z-10 font-mono text-primary select-none">
          <div className="flex flex-col items-center bg-white/95 backdrop-blur-md rounded-xl p-3 w-16 shadow-md border border-white/20">
            <span className="text-xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
            <span className="text-[8px] font-bold uppercase text-muted tracking-wider mt-0.5">Hours</span>
          </div>
          <span className="text-white font-bold text-xl">:</span>
          <div className="flex flex-col items-center bg-white/95 backdrop-blur-md rounded-xl p-3 w-16 shadow-md border border-white/20">
            <span className="text-xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
            <span className="text-[8px] font-bold uppercase text-muted tracking-wider mt-0.5">Mins</span>
          </div>
          <span className="text-white font-bold text-xl">:</span>
          <div className="flex flex-col items-center bg-white/95 backdrop-blur-md rounded-xl p-3 w-16 shadow-md border border-white/20">
            <span className="text-xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</span>
            <span className="text-[8px] font-bold uppercase text-muted tracking-wider mt-0.5">Secs</span>
          </div>
        </div>
      </div>

      {/* Step 1: Choose Your Pack Tier */}
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
              <span className="inline-block text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Value Pack
              </span>
              <h3 className="text-xl font-serif font-bold text-foreground">Double Compression Pack</h3>
              <p className="text-xs text-secondary leading-relaxed">Choose any 2 premium T-shirts with mixed sizes.</p>
              
              <div className="pt-4 flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-primary">{formatPrice(799)}</span>
                <span className="text-xs text-muted line-through">EGP 1,000</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest">Save EGP 200</span>
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
              <span className="inline-block text-[9px] font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Popular Pack
              </span>
              <h3 className="text-xl font-serif font-bold text-foreground">Triple Compression Pack</h3>
              <p className="text-xs text-secondary leading-relaxed">Choose any 3 premium T-shirts with custom sizes.</p>

              <div className="pt-4 flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-primary">{formatPrice(1150)}</span>
                <span className="text-xs text-muted line-through">EGP 1,500</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest">Save EGP 350</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Step 2: Configure Slots */}
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

        {/* Selected Slots Dashboard */}
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
                {/* Slot Tag */}
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-primary text-white`}>
                    Slot {index + 1}
                  </span>
                  
                  {hasProduct && (
                    <button
                      onClick={(e) => handleClearSlot(index, e)}
                      className="text-muted hover:text-red-500 p-1.5 rounded-full hover:bg-black/5 transition-colors"
                      title="Clear Selection"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {slot.product ? (
                  <div className="flex gap-4 items-start flex-1">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-white border border-border-light flex-shrink-0">
                      {slot.product.image_url ? (
                        <Image
                          src={slot.product.image_url}
                          alt={slot.product.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface" />
                      )}
                    </div>

                    {/* Meta */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div>
                        <h4 className="text-sm font-semibold text-primary truncate leading-tight">
                          {slot.product.title}
                        </h4>
                        <p className="text-[10px] text-muted font-medium mt-0.5">Original: {formatPrice(slot.product.price)}</p>
                      </div>

                      {/* Sizes for this Slot */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted block">Select Size:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {slot.product.sizes?.map((sz) => {
                            const isSelected = slot.size === sz;
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
                                  isSelected
                                    ? "bg-primary text-white border-primary shadow-sm scale-105"
                                    : isOutOfStock
                                    ? "bg-surface border-border-light text-muted/30 cursor-not-allowed line-through"
                                    : "bg-white border-border-light text-secondary hover:border-secondary hover:text-primary"
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
                    <p className="text-[10px] text-muted mt-1 leading-relaxed">Click to pick shirt for slot {index + 1}</p>
                  </div>
                )}

                {/* Status Indicator */}
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
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-border-light animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border-light flex justify-between items-center bg-surface">
              <div>
                <h3 className="text-lg font-serif font-bold text-primary">Choose T-Shirt for Slot {activeSelectIndex + 1}</h3>
                <p className="text-xs text-secondary mt-0.5">Pick any premium compression armor from the archive</p>
              </div>
              <button
                onClick={() => setActiveSelectIndex(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-border-light text-muted hover:text-foreground active:scale-95 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable Products list) */}
            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 custom-scrollbar">
              {products.map((p) => {
                // Check if any size is available
                const hasSizesAvailable = p.sizes?.some((sz) => getAvailableStock(p.id, sz, activeSelectIndex) > 0);

                return (
                  <div
                    key={p.id}
                    onClick={() => hasSizesAvailable && handleSelectProduct(activeSelectIndex, p)}
                    className={`group relative flex flex-col bg-surface rounded-2xl border p-3 cursor-pointer transition-all ${
                      !hasSizesAvailable
                        ? "opacity-40 grayscale cursor-not-allowed border-border-light"
                        : "border-border-light hover:border-muted hover:bg-white hover:shadow-md"
                    }`}
                  >
                    <div className="relative aspect-[4/5] bg-white rounded-xl overflow-hidden mb-3">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted/30 font-display text-xl">V</span>
                        </div>
                      )}

                      {!hasSizesAvailable && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-black/60 rounded">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-serif font-bold text-primary uppercase truncate">
                        {p.title}
                      </h4>
                      <p className="text-[10px] font-bold text-secondary">{formatPrice(p.price)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cart Summary and Actions Sticky Panel */}
      <div className="border-t border-border-light bg-surface p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Summary</p>
          <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
            <span className="text-xl font-bold text-primary">{formatPrice(bundlePrice)}</span>
            {isBundleComplete && originalPriceSum > 0 && (
              <>
                <span className="text-xs text-muted line-through font-medium">{formatPrice(originalPriceSum)}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Saved {formatPrice(discountAmount)}!
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-secondary font-medium">
            {tier}-Shirt bundle with custom sizes. Mixed style option enabled.
          </p>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`w-full md:w-auto min-w-[280px] h-16 flex items-center justify-center gap-3 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 shadow-xl ${
            isBundleComplete
              ? "bg-primary text-white hover:opacity-95 shadow-primary/10 hover:shadow-primary/20 scale-[1.02] cursor-pointer"
              : "bg-surface border border-border-light text-muted/60 hover:bg-surface/80 cursor-pointer"
          }`}
        >
          {isAdding ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Adding Set...
            </>
          ) : isBundleComplete ? (
            <>
              <ShoppingBag size={16} /> Add Bundle To Cart
            </>
          ) : (
            <>
              <AlertCircle size={16} /> Select All T-Shirts & Sizes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
