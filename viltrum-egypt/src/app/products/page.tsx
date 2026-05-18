"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import CartDrawer from "@/components/cart/CartDrawer";
import ViltrumLoader from "@/components/layout/ViltrumLoader";
import { Search } from "lucide-react";
import { trackTikTokEvent } from "@/lib/tiktok";

export default function ProductsPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackTikTokEvent("Search", {
        search_string: searchQuery,
        query: searchQuery,
        currency: "EGP",
      });
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="min-h-screen bg-background">
        {/* Page Header - High Impact */}
        <div className="px-5 pb-16 pt-44 text-center sm:pb-24 sm:pt-56 animate-fade-in">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted block mb-4 opacity-60">
            Curation
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl leading-none">
            The Archive
          </h1>
          <p className="mt-8 text-base sm:text-lg text-secondary max-w-xl mx-auto leading-relaxed font-medium italic">
            A comprehensive anthology of the Viltrum collection. Engineered for those who demand precision.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-12 max-w-md mx-auto relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search compression gear..."
              className="w-full h-14 pl-12 pr-24 rounded-2xl bg-surface border border-border-light text-foreground text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-5 bg-primary text-background text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              Search
            </button>
          </form>
        </div>

        {/* Product Grid */}
        <div className="mx-auto max-w-7xl px-5 pb-32 sm:px-8 sm:pb-44 lg:px-12">
          {loading ? (
            <ViltrumLoader />
          ) : filteredProducts.length === 0 ? (
            <div className="py-32 text-center rounded-[3rem] bg-surface border border-border-light">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted">
                {searchQuery ? `No results found for "${searchQuery}"` : "Archive is currently empty"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
