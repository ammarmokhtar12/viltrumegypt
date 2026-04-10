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

      <main className="min-h-screen bg-white">
        {/* Page Header */}
        <div className="pt-36 sm:pt-44 pb-16 sm:pb-24 text-center px-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-zinc-400 block mb-6">
            Browse
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-zinc-900 tracking-wide">
            All Products
          </h1>
          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Every piece in the Viltrum collection. Click to explore sizes and details.
          </p>
        </div>

        {/* Product Grid */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-28 sm:pb-40">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-300 text-lg">No products available yet.</p>
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
