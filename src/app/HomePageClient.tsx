"use client";

import { useState } from "react";
import { Product } from "@/types";
import type { ProductsFetchResult } from "@/lib/products";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/hero/HeroSection";
import PromoCountdownBanner from "@/components/products/PromoCountdownBanner";
import ProductGrid from "@/components/products/ProductGrid";
import CartDrawer from "@/components/cart/CartDrawer";
import StoreDataAlert from "@/components/store/StoreDataAlert";

interface HomePageClientProps {
  initial: ProductsFetchResult;
}

export default function HomePageClient({ initial }: HomePageClientProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const products: Product[] = initial.ok ? initial.products : [];
  const fetchError = initial.ok ? null : initial.message;

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <main className="bg-background min-h-screen">
        <HeroSection />
        {fetchError && (
          <div className="px-4 pb-8 -mt-4">
            <StoreDataAlert
              message={fetchError}
              variant={fetchError.includes("not connected") ? "warning" : "error"}
            />
          </div>
        )}
        <PromoCountdownBanner products={products} />
        <ProductGrid products={products} fetchError={fetchError} />
      </main>
      <Footer />
    </>
  );
}
