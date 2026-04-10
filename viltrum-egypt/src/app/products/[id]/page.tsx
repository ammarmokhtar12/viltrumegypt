"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Check, Minus, Plus, ArrowLeft } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6">
        <h1 className="text-3xl font-extrabold text-zinc-900">Product Not Found</h1>
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

      <main className="min-h-screen bg-slate-50 pt-24 sm:pt-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors duration-300 hover:text-zinc-900"
          >
            <ArrowLeft size={16} />
            <span>Back to products</span>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-28 sm:pb-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4" style={{ aspectRatio: "4/5" }}>
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  className="object-cover object-center rounded-2xl"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl font-bold text-zinc-400">V</span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center py-8 lg:py-16">
              <div className="max-w-md">
                <div className="space-y-4 mb-10">
                  <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-5xl md:text-6xl">
                    {product.title}
                  </h1>
                  <p className="text-2xl font-bold tracking-wide text-zinc-600 sm:text-3xl">
                    {formatPrice(product.price)}
                  </p>
                </div>

                {product.description && (
                  <p className="text-base sm:text-lg leading-relaxed text-zinc-600 mb-12 font-light">
                    {product.description}
                  </p>
                )}

                <div className="space-y-4 mb-10">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-600 block">
                    Size
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`flex h-12 w-14 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 sm:h-14 sm:w-16 ${
                          selectedSize === size
                            ? "bg-zinc-900 text-white"
                            : "bg-white text-zinc-600 hover:text-zinc-900"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 mb-12">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-600 block">
                    Quantity
                  </label>
                  <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-12 w-12 items-center justify-center text-zinc-600 transition-colors hover:text-zinc-900"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="flex h-12 w-14 items-center justify-center border-x border-zinc-200 text-sm font-semibold text-zinc-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex h-12 w-12 items-center justify-center text-zinc-600 transition-colors hover:text-zinc-900"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || added}
                  className={`flex h-14 w-full items-center justify-center gap-3 rounded-full text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-500 sm:h-16 ${
                    added
                      ? "bg-emerald-600 text-white"
                      : !selectedSize
                      ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
                      : "bg-zinc-900 text-white hover:bg-zinc-700"
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={18} />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      {selectedSize ? "Add to Cart" : "Select a Size"}
                    </>
                  )}
                </button>

                <div className="mt-10 space-y-3 border-t border-zinc-200 pt-10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-600">
                    Free shipping across Egypt
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-600">
                    Delivery within 3–5 business days
                  </p>
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
