"use client";

import FrequentlyBoughtBundle from "@/components/products/FrequentlyBoughtBundle";
import { isBestSeller } from "@/lib/productSorting";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductImage from "@/components/products/ProductImage";
import { ShoppingBag, Check, Minus, Plus, ArrowLeft, Truck, ShieldCheck, Heart, Zap, RefreshCw } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ReviewSection from "@/components/products/ReviewSection";
import ProductDetailSkeleton from "@/components/products/ProductDetailSkeleton";
import { toast } from "sonner";
import { trackTikTokEvent } from "@/lib/tiktok";
import { trackMetaEvent } from "@/lib/meta";
import gsap from "gsap";

import SizeGuideModal from "@/components/products/SizeGuideModal";
import SizeRecommender from "@/components/products/SizeRecommender";
import { useCountdown } from "@/lib/useCountdown";
import BundleBuilder from "@/components/products/BundleBuilder";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const timeLeft = useCountdown();
  const productId = params.id as string;
  const [showStickyBar, setShowStickyBar] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById("main-buy-buttons");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setShowStickyBar(rect.bottom < 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      if (!isSupabaseConfigured) {
        toast.error("Store database is not connected.");
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (!error && data) {
          setProduct(data);
          if (data.image_url) {
            setActiveImage(data.image_url);
          } else if (data.gallery_urls?.length > 0) {
            setActiveImage(data.gallery_urls[0]);
          }

          // Fetch size stock levels
          try {
            const { data: invData } = await supabase
              .from("inventory")
              .select("size, quantity")
              .eq("product_id", productId);

            if (invData) {
              const invMap: Record<string, number> = {};
              invData.forEach((row: any) => {
                invMap[row.size] = row.quantity;
              });
              setInventory(invMap);
            }
          } catch (e) {
            console.warn("Failed to fetch inventory:", e);
          }

          // Fetch all active products for the bundle offer
          try {
            const { data: allProds } = await supabase
              .from("products")
              .select("*")
              .eq("is_active", true);
            if (allProds) setAllProducts(allProds as Product[]);
          } catch (e) {
            console.warn("Failed to fetch all products:", e);
          }

          // Track ViewContent event
          trackTikTokEvent("ViewContent", {
            content_type: "product",
            content_id: data.id,
            content_name: data.title,
            value: data.price,
            currency: "EGP",
            contents: [{
              content_id: data.id,
              content_type: "product",
              content_name: data.title,
              quantity: 1,
              price: data.price,
            }],
          });
          trackMetaEvent("ViewContent", {
            content_type: "product",
            content_ids: [data.id],
            content_name: data.title,
            value: data.price,
            currency: "EGP",
            contents: [{ id: data.id, quantity: 1, item_price: data.price }],
          });
        } else if (error) {
          toast.error("Could not load this product.");
        }
      } catch {
        toast.error("Could not load this product.");
      }
      setLoading(false);
    }

    fetchProduct();
  }, [productId]);

  const handleBuyNow = () => {
    if (!product) return;
    if (!selectedSize) {
      toast.error("يرجى اختيار المقاس أولاً", {
        description: "اضغط على مقاسك المناسب لإتمام الطلب فوراً",
      });
      const el = document.getElementById("size-selector-target");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const stock = inventory[selectedSize];
    if (stock !== undefined && stock <= 0) {
      toast.error("المقاس المحدد نفذت كميته");
      return;
    }
    addItem({
      product_id: product.id,
      title: product.title,
      price: product.price,
      size: selectedSize,
      quantity,
      image_url: product.image_url,
    });
    trackTikTokEvent("InitiateCheckout", {
      content_type: "product",
      contents: [{
        content_id: product.id,
        content_type: "product",
        content_name: product.title,
        quantity,
        price: product.price,
      }],
      value: product.price * quantity,
      currency: "EGP",
    });
    router.push("/checkout");
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      toast.error("يرجى اختيار المقاس أولاً", {
        description: "اضغط على المقاس المناسب لك للإضافة للسلة",
      });
      const el = document.getElementById("size-selector-target");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Validate stock quantity before adding
    const stock = inventory[selectedSize];
    if (stock !== undefined && stock <= 0) {
      toast.error("المقاس المحدد نفذت كميته");
      return;
    }
    if (stock !== undefined && quantity > stock) {
      toast.error(`المتاح فقط ${stock} قطع، يرجى تقليل الكمية.`);
      return;
    }
    addItem({
      product_id: product.id,
      title: product.title,
      price: product.price,
      size: selectedSize,
      quantity,
      image_url: product.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);

    const galleryEl = document.getElementById("main-product-image");
    const imgEl = galleryEl ? galleryEl.querySelector("img") : null;
    const cartEl = document.getElementById("cart-icon-target");
    if (imgEl && cartEl) {
      const clone = imgEl.cloneNode(true) as HTMLElement;
      const rect = imgEl.getBoundingClientRect();
      clone.style.position = "fixed";
      clone.style.top = rect.top + "px";
      clone.style.left = rect.left + "px";
      clone.style.width = rect.width + "px";
      clone.style.height = rect.height + "px";
      clone.style.zIndex = "9999";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);

      const cartRect = cartEl.getBoundingClientRect();
      gsap.to(clone, {
        top: cartRect.top,
        left: cartRect.left,
        width: 30,
        height: 30,
        opacity: 0.2,
        duration: 0.8,
        ease: "power3.inOut",
        onComplete: () => {
          clone.remove();
        }
      });
    }

    // Track AddToCart event
    trackTikTokEvent("AddToCart", {
      content_type: "product",
      content_id: product.id,
      content_name: product.title,
      value: product.price * quantity,
      currency: "EGP",
      contents: [{
        content_id: product.id,
        content_type: "product",
        content_name: product.title,
        quantity,
        price: product.price,
      }],
    });
    trackMetaEvent("AddToCart", {
      content_type: "product",
      content_ids: [product.id],
      content_name: product.title,
      value: product.price * quantity,
      currency: "EGP",
      contents: [{ id: product.id, quantity, item_price: product.price }],
      num_items: quantity,
    });
  };

  const handleAddToWishlist = () => {
    if (!product) return;
    setWishlistAdded(true);
    toast.success("Added to Wishlist!", {
      description: `${product.title} has been added to your wishlist.`,
    });

    // Track AddToWishlist event
    trackTikTokEvent("AddToWishlist", {
      content_type: "product",
      content_id: product.id,
      content_name: product.title,
      value: product.price,
      currency: "EGP",
      contents: [{
        content_id: product.id,
        content_type: "product",
        content_name: product.title,
        quantity: 1,
        price: product.price,
      }],
    });
    trackMetaEvent("AddToWishlist", {
      content_type: "product",
      content_ids: [product.id],
      content_name: product.title,
      value: product.price,
      currency: "EGP",
      contents: [{ id: product.id, quantity: 1, item_price: product.price }],
    });
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6">
        <h1 className="text-3xl font-bold text-foreground">Asset Not Found</h1>
        <p className="text-secondary text-sm font-medium">The requested unit does not exist in our current inventory.</p>
        <Link href="/products" className="btn-primary">
          Back to Inventory
        </Link>
      </div>
    );
  }

  const availableSizes = product.title === "Thragg Edition" ? ["L", "XL", "XXL"] : (product.sizes || ["S", "M", "L", "XL", "XXL"]);
  const originalPrice = product.price === 480 ? 600 : Math.round(product.price * 1.25);

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <SizeGuideModal isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />

      <main className="min-h-screen bg-background pt-32 sm:pt-44">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-foreground mb-12"
          >
            <ArrowLeft size={14} />
            <span>Return to Archive</span>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-32 sm:pb-44">
          {product.title.toUpperCase() === "LIMITED OFFER" ? (
            <BundleBuilder limitedOfferProduct={product} onCartOpen={() => setCartOpen(true)} />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
                
                {/* Gallery Section */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Swipeable Main Gallery */}
                  <div
                    id="main-product-image"
                    className="relative overflow-x-auto flex snap-x snap-mandatory scroll-smooth hide-scrollbar rounded-2xl bg-surface border border-border-light shadow-2xl group"
                    style={{ aspectRatio: "4/5" }}
                  >
                    {[product.image_url, ...(product.gallery_urls || [])]
                      .filter(Boolean)
                      .map((url, index) => (
                        <div
                          key={index}
                          className="min-w-full flex-shrink-0 snap-center relative"
                        >
                          <ProductImage
                            src={url!}
                            alt={`${product.title} - Image ${index + 1}`}
                            fill
                            className="object-cover object-center lg:group-hover:scale-105 transition-transform duration-1000"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority={index === 0}
                          />
                        </div>
                      ))}

                    {/* Floating Tag */}
                    <div className="absolute top-6 left-6 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border-light shadow-sm z-10 pointer-events-none">
                       <p className="text-[9px] font-bold text-foreground uppercase tracking-widest">Swipe to View</p>
                    </div>
                  </div>

                  {/* Dot Indicators */}
                  {(() => {
                    const allImages = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);
                    if (allImages.length <= 1) return null;
                    return (
                      <div className="flex justify-center items-center gap-2 pt-1">
                        {allImages.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const container = document.getElementById("main-product-image");
                              if (container) container.scrollTo({ left: container.scrollWidth / allImages.length * i, behavior: "smooth" });
                              setActiveImage(url!);
                            }}
                            className={`rounded-full transition-all duration-300 ${
                              activeImage === url
                                ? 'w-5 h-2 bg-primary'
                                : 'w-2 h-2 bg-border-light hover:bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    );
                  })()}

                  {/* Thumbnails */}
                  <div className="hidden sm:flex gap-3 pt-1 overflow-x-auto hide-scrollbar">
                    {/* Main Image Thumbnail */}
                    {product.image_url && (
                      <button
                        onClick={() => {
                          const container = document.getElementById("main-product-image");
                          if (container) container.scrollTo({ left: 0, behavior: "smooth" });
                          setActiveImage(product.image_url!);
                        }}
                        className={`relative flex-shrink-0 w-24 aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 group/thumb ${
                          activeImage === product.image_url
                            ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20'
                            : 'border-border-light opacity-60 hover:opacity-100 hover:border-secondary hover:shadow-md'
                        }`}
                      >
                        <ProductImage src={product.image_url} alt="Main" fill className="object-cover transition-transform duration-500 group-hover/thumb:scale-110" />
                        {activeImage === product.image_url && (
                          <div className="absolute inset-0 ring-inset ring-2 ring-primary/30 rounded-2xl pointer-events-none" />
                        )}
                      </button>
                    )}

                    {/* Gallery Thumbnails */}
                    {product.gallery_urls?.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const container = document.getElementById("main-product-image");
                          if (container) {
                            const allImgs = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);
                            container.scrollTo({ left: (container.scrollWidth / allImgs.length) * (i + 1), behavior: "smooth" });
                          }
                          setActiveImage(url);
                        }}
                        className={`relative flex-shrink-0 w-24 aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 group/thumb ${
                          activeImage === url
                            ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20'
                            : 'border-border-light opacity-60 hover:opacity-100 hover:border-secondary hover:shadow-md'
                        }`}
                      >
                        <ProductImage src={url} alt={`View ${i + 2}`} fill className="object-cover transition-transform duration-500 group-hover/thumb:scale-110" />
                        {activeImage === url && (
                          <div className="absolute inset-0 ring-inset ring-2 ring-primary/30 rounded-2xl pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Section */}
                <div className="lg:col-span-5 flex flex-col pt-4">
                  <div className="space-y-12">
                    
                    {/* Title & Price */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isBestSeller(product.title) && (
                            <span className="bg-zinc-800 text-zinc-300 text-[10px] font-medium px-2.5 py-1 rounded-md w-fit">
                              Best Seller
                            </span>
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-60">Specifications</span>
                        </div>
                        <h1 className="text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl tracking-tight">
                          {product.title}
                        </h1>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-base sm:text-lg text-muted line-through">
                          {formatPrice(originalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {product.description && product.title !== "Thragg Edition" && (
                      <div className="space-y-4">
                         <p className="text-base sm:text-lg leading-relaxed text-secondary font-medium italic">
                            &ldquo;{product.description}&rdquo;
                         </p>
                      </div>
                    )}

                    {product.title === "Thragg Edition" && (
                      <div className="bg-surface border border-primary/20 p-6 rounded-2xl space-y-3 relative overflow-hidden mb-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Status: Under Design</p>
                        </div>
                        <p className="text-lg font-bold text-foreground">تحت مرحله التصميم</p>
                        <p className="text-sm text-secondary leading-relaxed">Pre-order yours and it will be sent to you as soon as it is made.</p>
                      </div>
                    )}

                    <div className="h-px bg-border-light w-24"></div>

                    {/* Configuration: Size */}
                    <div id="size-selector-target" className="space-y-5 scroll-mt-24">
                       <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block">
                              Select Fit
                            </label>
                            {/* Stock Level Warning Notice */}
                            {selectedSize && inventory[selectedSize] !== undefined && (
                              <div className="text-[10px] font-bold uppercase tracking-wider">
                                {inventory[selectedSize] > 0 ? (
                                  inventory[selectedSize] <= 3 ? (
                                    <span className="text-amber-600">Only {inventory[selectedSize]} left in stock</span>
                                  ) : (
                                    <span className="text-emerald-600">✓ In Stock ({inventory[selectedSize]} available)</span>
                                  )
                                ) : (
                                  <span className="text-red-500 font-extrabold animate-pulse">✗ Out of Stock (نفذت الكمية)</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-accent">لو عايز تعرف مقاسك بالظبط دوس هنا &rarr;</span>
                            <button 
                              onClick={() => setSizeGuideOpen(true)}
                              className="text-[10px] font-bold text-primary uppercase tracking-widest underline underline-offset-4 hover:opacity-70 transition-opacity"
                            >
                              Size Assistant
                            </button>
                          </div>
                       </div>
                      <div className="flex flex-wrap gap-2.5">
                        {availableSizes.map((size) => {
                          const isOutOfStock = inventory[size] !== undefined && inventory[size] <= 0;
                          return (
                            <button
                              key={size}
                              disabled={isOutOfStock}
                              onClick={() => setSelectedSize(size)}
                              className={`flex h-12 w-16 items-center justify-center rounded-xl text-xs font-bold transition-all duration-300 relative ${
                                selectedSize === size
                                  ? "bg-accent text-white shadow-lg shadow-accent/20 scale-105"
                                  : isOutOfStock
                                  ? "bg-surface border border-border-light text-muted/30 cursor-not-allowed line-through"
                                  : "bg-surface border border-border-light text-secondary hover:text-foreground hover:border-secondary"
                              }`}
                            >
                              {size}
                              {isOutOfStock && (
                                <span className="absolute bottom-1 text-[7px] text-red-500 font-bold uppercase scale-75">OUT</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Configuration: Quantity */}
                    <div className="space-y-5">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block">
                        Quantity
                      </label>
                      <div className="inline-flex items-center rounded-xl border border-border-light bg-surface p-1 shadow-sm">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="flex h-12 w-12 items-center justify-center text-muted transition-colors hover:text-foreground hover:bg-background rounded-lg active:scale-95"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="flex h-12 w-14 items-center justify-center text-sm font-bold text-foreground">
                          {quantity}
                        </span>
                        <button
                          onClick={() => {
                            const maxStock = selectedSize && inventory[selectedSize] !== undefined ? inventory[selectedSize] : Infinity;
                            setQuantity(Math.min(quantity + 1, maxStock));
                          }}
                          disabled={selectedSize ? (inventory[selectedSize] !== undefined && quantity >= inventory[selectedSize]) : false}
                          className="flex h-12 w-12 items-center justify-center text-muted transition-colors hover:text-foreground hover:bg-background rounded-lg disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Main Action Buttons */}
                    <div id="main-buy-buttons" className="pt-4 space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Direct Buy Now Button */}
                        <button
                          onClick={handleBuyNow}
                          className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider bg-white hover:bg-zinc-100 text-zinc-950 shadow-xl active:scale-[0.98] transition-all cursor-pointer h-14"
                        >
                          <Zap size={18} className="fill-zinc-950 text-zinc-950" />
                          <span>اشتري الآن (دفع فوري)</span>
                        </button>

                        {/* Add to Cart Button */}
                        <button
                          onClick={handleAddToCart}
                          className={`flex-1 flex items-center justify-center gap-2.5 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all h-14 cursor-pointer ${
                            added
                              ? "bg-emerald-600 text-white"
                              : "bg-surface border border-border-light text-foreground hover:border-secondary active:scale-[0.98]"
                          }`}
                        >
                          {added ? (
                            <>
                              <Check size={18} />
                              <span>تمت الإضافة للسلة</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={18} />
                              <span>أضف للسلة</span>
                            </>
                          )}
                        </button>

                        {/* Wishlist */}
                        <button
                          onClick={handleAddToWishlist}
                          disabled={wishlistAdded}
                          className={`w-full sm:w-14 h-12 sm:h-14 flex items-center justify-center rounded-2xl border transition-all ${
                            wishlistAdded
                              ? "bg-rose-50 border-rose-200 text-rose-600"
                              : "bg-surface border-border-light text-secondary hover:text-rose-600 hover:border-rose-300"
                          }`}
                          title="Add to Wishlist"
                        >
                          <Heart size={20} className={wishlistAdded ? "fill-rose-600 text-rose-600" : ""} />
                        </button>
                      </div>

                      {/* Micro-Trust Badges for Mobile */}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-surface border border-border-light">
                          <Truck size={16} className="text-zinc-400 mb-1" />
                          <span className="text-[10px] font-bold text-foreground">شحن سريع</span>
                          <span className="text-[9px] text-muted">3-5 أيام لبيتك</span>
                        </div>
                        <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-surface border border-border-light">
                          <ShieldCheck size={16} className="text-zinc-400 mb-1" />
                          <span className="text-[10px] font-bold text-foreground">معاينة قبل الدفع</span>
                          <span className="text-[9px] text-muted">استلم وأنت متطمن</span>
                        </div>
                        <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-surface border border-border-light">
                          <RefreshCw size={16} className="text-zinc-400 mb-1" />
                          <span className="text-[10px] font-bold text-foreground">استبدال سهل</span>
                          <span className="text-[9px] text-muted">خدمة عملاء فورية</span>
                        </div>
                      </div>
                    </div>

                    {/* Frequently Bought Together Bundle Deal (2 for 850 EGP) */}
                    <div id="bundle-offer-section">
                      <FrequentlyBoughtBundle
                        currentProduct={product}
                        allProducts={allProducts}
                        currentSelectedSize={selectedSize}
                        onCartOpen={() => setCartOpen(true)}
                      />
                    </div>

                    {/* Service Highlights */}
                    <div className="pt-12 border-t border-border-light">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-surface border border-border-light flex items-center justify-center text-muted shadow-sm">
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">Assurance</p>
                             <p className="text-[11px] text-muted font-medium mt-1 leading-relaxed">3–5 business day fulfillment window.</p>
                          </div>
                       </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Reviews Section */}
              <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-16">
                <ReviewSection productId={productId} />
              </div>
            </>
          )}
        </div>
      
      {/* Sticky Mobile Bar on Product Page */}
      {showStickyBar && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            {/* Info + Quick Size */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0">
                {product.image_url ? (
                  <ProductImage src={product.image_url} alt={product.title} fill className="object-cover" sizes="44px" />
                ) : (
                  <div className="w-full h-full bg-zinc-800" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">{product.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-white">{formatPrice(product.price)}</span>
                  {selectedSize ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      {selectedSize}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        const el = document.getElementById("size-selector-target");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="text-[10px] font-semibold text-accent underline"
                    >
                      اختر المقاس
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Buy Button */}
            <button
              onClick={handleBuyNow}
              className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs uppercase px-5 py-3 rounded-xl shadow-lg flex items-center gap-1.5 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            >
              <Zap size={14} className="fill-zinc-950 text-zinc-950" />
              <span>اشتري الآن</span>
            </button>
          </div>
        </div>
      )}

      </main>

      <Footer />
    </>
  );
}
