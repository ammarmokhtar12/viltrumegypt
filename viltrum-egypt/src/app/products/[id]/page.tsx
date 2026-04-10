"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Check, Minus, Plus, ArrowLeft, Truck, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [cartOpen, setCartOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-light border-t-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
        <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
        <Link href="/products" className="btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  const availableSizes = product.sizes || ["S", "M", "L", "XL", "XXL"];

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="min-h-screen bg-background pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={15} />
            <span>Back to products</span>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-20 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Image */}
            <div className="relative overflow-hidden rounded-2xl bg-surface border border-border-light" style={{ aspectRatio: "4/5" }}>
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-7xl font-display text-muted/20">V</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center py-4 lg:py-8">
              <div className="max-w-md">
                <div className="space-y-2 mb-8">
                  <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                    {product.title}
                  </h1>
                  <p className="text-2xl font-bold text-secondary">
                    {formatPrice(product.price)}
                  </p>
                </div>

                {product.description && (
                  <p className="text-base leading-relaxed text-secondary mb-8">
                    {product.description}
                  </p>
                )}

                {/* Size */}
                <div className="space-y-3 mb-8">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted block">
                    Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`flex h-11 w-14 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
                          selectedSize === size
                            ? "bg-primary text-background"
                            : "bg-surface border border-border-light text-secondary hover:text-foreground hover:border-secondary"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-3 mb-8">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted block">
                    Quantity
                  </label>
                  <div className="inline-flex items-center rounded-lg border border-border-light bg-surface">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-foreground"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="flex h-11 w-12 items-center justify-center border-x border-border-light text-sm font-semibold text-foreground">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-foreground"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || added}
                  className={`flex h-13 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                    added
                      ? "bg-emerald-600 text-white"
                      : !selectedSize
                      ? "cursor-not-allowed bg-surface border border-border-light text-muted"
                      : "bg-primary text-background hover:opacity-90 shadow-lg shadow-primary/10"
                  }`}
                  style={{ minHeight: "3.25rem" }}
                >
                  {added ? (
                    <>
                      <Check size={17} />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={17} />
                      {selectedSize ? "Add to Cart" : "Select a Size"}
                    </>
                  )}
                </button>

                {/* Trust badges */}
                <div className="mt-8 space-y-3 border-t border-border-light pt-8">
                  <div className="flex items-center gap-3 text-secondary">
                    <Truck size={15} className="text-muted" />
                    <span className="text-sm">Free shipping across Egypt</span>
                  </div>
                  <div className="flex items-center gap-3 text-secondary">
                    <Shield size={15} className="text-muted" />
                    <span className="text-sm">Delivery within 3–5 business days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
