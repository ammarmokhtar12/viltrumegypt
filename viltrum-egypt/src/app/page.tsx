"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types";
import { fetchActiveProducts } from "@/lib/products";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/hero/HeroSection";
import ProductGrid from "@/components/products/ProductGrid";
import CartDrawer from "@/components/cart/CartDrawer";
import ViltrumLoader from "@/components/layout/ViltrumLoader";
import StoreDataAlert from "@/components/store/StoreDataAlert";

export default function HomePage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setFetchError(null);
      const result = await fetchActiveProducts();
      if (result.ok) {
        setProducts(result.products);
      } else {
        setFetchError(result.message);
        setProducts([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      {loading && <ViltrumLoader />}
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <main className="bg-background min-h-screen">
        <HeroSection />
        {fetchError && !loading && (
          <div className="px-4 pb-8 -mt-4">
            <StoreDataAlert
              message={fetchError}
              variant={fetchError.includes("not connected") ? "warning" : "error"}
            />
          </div>
        )}
        <ProductGrid products={products} fetchError={fetchError} />
      </main>
      <Footer />
    </>
  );
}
