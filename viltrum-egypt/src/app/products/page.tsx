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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="min-h-screen bg-background">
        {/* Page Header - High Impact */}
        <div className="px-5 pb-24 pt-44 text-center sm:pb-32 sm:pt-56 animate-fade-in">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted block mb-4 opacity-60">
            Curation
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl leading-none">
            The Archive
          </h1>
          <p className="mt-8 text-base sm:text-lg text-secondary max-w-xl mx-auto leading-relaxed font-medium italic">
            A comprehensive anthology of the Viltrum collection. Engineered for those who demand precision.
          </p>
        </div>

        {/* Product Grid */}
        <div className="mx-auto max-w-7xl px-5 pb-32 sm:px-8 sm:pb-44 lg:px-12">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
               <div className="w-8 h-8 border-2 border-border-light border-t-foreground rounded-full animate-spin" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Syncing Inventory</span>
            </div>
          ) : products.length === 0 ? (
            <div className="py-32 text-center rounded-[3rem] bg-surface border border-border-light">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted">Archive is currently empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
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
