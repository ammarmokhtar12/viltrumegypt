"use client";

import { useState } from "react";
import { Product } from "@/types";
import type { ProductsFetchResult } from "@/lib/products";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import CartDrawer from "@/components/cart/CartDrawer";
import StoreDataAlert from "@/components/store/StoreDataAlert";
import { Search } from "lucide-react";
import { trackTikTokEvent } from "@/lib/tiktok";

interface ProductsPageClientProps {
  initial: ProductsFetchResult;
}

export default function ProductsPageClient({ initial }: ProductsPageClientProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const products: Product[] = initial.ok ? initial.products : [];
  const fetchError = initial.ok ? null : initial.message;

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
        <div className="px-5 pb-12 pt-44 text-center sm:pb-20 sm:pt-56 bg-surface/50 border-b border-border-light">
          <p className="type-eyebrow mb-4">Curation</p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl type-headline leading-none">
            The Archive
          </h1>
          <p className="mt-8 text-base sm:text-lg text-secondary max-w-xl mx-auto leading-relaxed font-serif italic font-normal">
            A comprehensive anthology of the Viltrum collection. Engineered for those who demand precision.
          </p>

          <form onSubmit={handleSearchSubmit} className="mt-12 max-w-md mx-auto relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search compression gear..."
              className="viltrum-input !h-14 !pl-12 !pr-28 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-5 bg-primary text-white text-[10px] font-semibold uppercase tracking-widest rounded-lg hover:bg-foreground transition-colors flex items-center justify-center font-sans"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-32 sm:px-8 sm:pb-44 lg:px-12 pt-12">
          {fetchError ? (
            <StoreDataAlert message={fetchError} variant="error" />
          ) : filteredProducts.length === 0 ? (
            <div className="py-32 text-center rounded-3xl bg-surface border border-border-light">
              <p className="type-eyebrow">
                {searchQuery ? `No results found for "${searchQuery}"` : "Archive is currently empty"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
              {filteredProducts.map((product) => (
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
