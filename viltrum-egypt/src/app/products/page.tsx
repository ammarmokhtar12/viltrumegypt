"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import CartDrawer from "@/components/cart/CartDrawer";

export default function ProductsPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setProducts(data);
        }
      } catch {
        console.log("Failed to fetch products");
      }
    }
    fetchProducts();
  }, []);

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="min-h-screen bg-slate-50">
        {/* Page Header */}
        <div className="px-6 pb-20 pt-40 text-center sm:pb-28 sm:pt-48">
          <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-zinc-600 block mb-6">
            Browse
          </span>
          <h1 className="text-5xl font-extrabold tracking-tighter text-zinc-900 sm:text-6xl md:text-7xl">
            All Products
          </h1>
          <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-lg mx-auto leading-relaxed">
            Every piece in the Viltrum collection. Click to explore sizes and details.
          </p>
        </div>

        {/* Product Grid */}
        <div className="mx-auto max-w-7xl px-6 pb-32 sm:px-8 sm:pb-44 lg:px-12">
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-zinc-600">No products available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12 lg:gap-16">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
