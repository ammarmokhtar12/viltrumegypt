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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6">
        <h1 className="font-display text-3xl text-zinc-900">Product Not Found</h1>
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

      <main className="min-h-screen bg-white pt-24 sm:pt-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-900 transition-colors duration-300 font-medium"
          >
            <ArrowLeft size={16} />
            <span>Back to products</span>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-28 sm:pb-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="relative bg-zinc-50 overflow-hidden" style={{ aspectRatio: "4/5" }}>
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
                  <span className="text-zinc-200 font-display text-8xl">V</span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center py-8 lg:py-16">
              <div className="max-w-md">
                <div className="space-y-4 mb-10">
                  <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-zinc-900 tracking-wide leading-tight">
                    {product.title}
                  </h1>
                  <p className="text-2xl sm:text-3xl font-display text-zinc-500 tracking-wider">
                    {formatPrice(product.price)}
                  </p>
                </div>

                {product.description && (
                  <p className="text-base sm:text-lg leading-relaxed text-zinc-400 mb-12 font-light">
                    {product.description}
                  </p>
                )}

                <div className="space-y-4 mb-10">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-400 block">
                    Size
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-12 w-14 sm:h-14 sm:w-16 flex items-center justify-center text-sm font-medium border transition-all duration-300 rounded-sm ${
                          selectedSize === size
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 mb-12">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-400 block">
                    Quantity
                  </label>
                  <div className="inline-flex items-center border border-zinc-200 rounded-sm">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-12 w-12 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="h-12 w-14 flex items-center justify-center text-sm font-semibold text-zinc-900 border-x border-zinc-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-12 w-12 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || added}
                  className={`w-full h-14 sm:h-16 flex items-center justify-center gap-3 text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-500 rounded-sm ${
                    added
                      ? "bg-emerald-600 text-white"
                      : !selectedSize
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
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

                <div className="mt-10 pt-10 border-t border-zinc-100 space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-300 font-semibold">
                    Free shipping across Egypt
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-300 font-semibold">
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
