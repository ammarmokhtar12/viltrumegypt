"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Check, Minus, Plus, ArrowLeft, Truck, ShieldCheck, ArrowRight, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ReviewSection from "@/components/products/ReviewSection";
import ViltrumLoader from "@/components/layout/ViltrumLoader";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [cartOpen, setCartOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeMedia, setActiveMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (!error && data) {
          setProduct(data);
          // Set initial media
          if (data.image_url) {
            setActiveMedia({ type: 'image', url: data.image_url });
          } else if (data.gallery_urls?.length > 0) {
            setActiveMedia({ type: 'image', url: data.gallery_urls[0] });
          } else if (data.video_url) {
            setActiveMedia({ type: 'video', url: data.video_url });
          }
        }
      } catch {
        console.log("Failed to fetch product");
      }
      setLoading(false);
    }

    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product || !selectedSize) return;
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
  };

  if (loading) {
    return <ViltrumLoader />;
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

  const availableSizes = product.sizes || ["S", "M", "L", "XL", "XXL"];

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
            
            {/* Gallery Section */}
            <div className="lg:col-span-7 space-y-6">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-surface border border-border-light shadow-2xl group" style={{ aspectRatio: "4/5" }}>
                {activeMedia?.type === 'video' ? (
                   <video
                     src={activeMedia.url}
                     className="w-full h-full object-cover"
                     autoPlay
                     muted
                     loop
                     playsInline
                   />
                ) : activeMedia?.type === 'image' ? (
                  <Image
                    src={activeMedia.url}
                    alt={product.title}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-1000"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl font-display text-muted/10">V</span>
                  </div>
                )}
                
                {/* Floating Tag */}
                <div className="absolute top-8 left-8 bg-background/80 backdrop-blur-md px-4 py-2 rounded-xl border border-border-light shadow-sm">
                   <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">In Stock · Guaranteed</p>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex flex-wrap gap-4 pt-2">
                 {/* Main Image Thumbnail */}
                 {product.image_url && (
                   <button
                     onClick={() => setActiveMedia({ type: 'image', url: product.image_url! })}
                     className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                       activeMedia?.url === product.image_url ? 'border-primary shadow-lg scale-105' : 'border-border-light grayscale hover:grayscale-0'
                     }`}
                   >
                      <Image src={product.image_url} alt="Main" fill className="object-cover" />
                   </button>
                 )}

                 {/* Gallery Thumbnails */}
                 {product.gallery_urls?.map((url, i) => (
                   <button
                     key={i}
                     onClick={() => setActiveMedia({ type: 'image', url })}
                     className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                       activeMedia?.url === url ? 'border-primary shadow-lg scale-105' : 'border-border-light grayscale hover:grayscale-0'
                     }`}
                   >
                      <Image src={url} alt={`Gallery ${i}`} fill className="object-cover" />
                   </button>
                 ))}

                 {/* Video Thumbnail */}
                 {product.video_url && (
                   <button
                     onClick={() => setActiveMedia({ type: 'video', url: product.video_url! })}
                     className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center transition-all bg-surface ${
                       activeMedia?.type === 'video' ? 'border-primary shadow-lg scale-105' : 'border-border-light grayscale hover:grayscale-0'
                     }`}
                   >
                      <ImageIcon size={20} className="text-primary mb-1" />
                      <span className="text-[8px] font-bold uppercase">360 View</span>
                   </button>
                 )}
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:col-span-5 flex flex-col pt-4">
              <div className="space-y-12">
                
                {/* Title & Price */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-60">Specifications</span>
                    <h1 className="text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl tracking-tight">
                      {product.title}
                    </h1>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-bold text-muted uppercase tracking-widest">MSRP</span>
                    <p className="text-3xl font-bold text-foreground">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="space-y-4">
                     <p className="text-base sm:text-lg leading-relaxed text-secondary font-medium italic">
                        &ldquo;{product.description}&rdquo;
                     </p>
                  </div>
                )}

                <div className="h-px bg-border-light w-24"></div>

                {/* Configuration: Size */}
                <div className="space-y-5">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                        Select Fit
                      </label>
                      <button className="text-[10px] font-bold text-primary uppercase tracking-widest underline underline-offset-4">Size Guide</button>
                   </div>
                  <div className="flex flex-wrap gap-2.5">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`flex h-12 w-16 items-center justify-center rounded-xl text-xs font-bold transition-all duration-300 ${
                          selectedSize === size
                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                            : "bg-surface border border-border-light text-secondary hover:text-foreground hover:border-secondary"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
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
                      className="flex h-10 w-10 items-center justify-center text-muted transition-colors hover:text-foreground hover:bg-background rounded-lg"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="flex h-10 w-12 items-center justify-center text-xs font-bold text-foreground">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex h-10 w-10 items-center justify-center text-muted transition-colors hover:text-foreground hover:bg-background rounded-lg"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Main Action */}
                <div className="pt-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedSize || added}
                    className={`flex items-center justify-center gap-3 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 w-full group ${
                      added
                        ? "bg-emerald-600 text-white"
                        : !selectedSize
                        ? "cursor-not-allowed bg-surface border border-border-light text-muted opacity-50"
                        : "bg-primary text-background hover:opacity-90 shadow-2xl shadow-primary/10"
                    }`}
                    style={{ minHeight: "4rem" }}
                  >
                    {added ? (
                      <>
                        <Check size={18} />
                        Successfully Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
                        {selectedSize ? `Add to Cart — ${formatPrice(product.price * quantity)}` : "Identify Your Size"}
                      </>
                    )}
                  </button>
                </div>

                {/* Service Highlights */}
                <div className="grid grid-cols-2 gap-6 pt-12 border-t border-border-light">
                   <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface border border-border-light flex items-center justify-center text-muted shadow-sm">
                        <Truck size={18} />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">Logistics</p>
                         <p className="text-[11px] text-muted font-medium mt-1 leading-relaxed">Delivery costs calculated via WhatsApp.</p>
                      </div>
                   </div>
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
        </div>
      </main>

      <Footer />
    </>
  );
}
