"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/hero/HeroSection";
import ProductGrid from "@/components/products/ProductGrid";
import CartDrawer from "@/components/cart/CartDrawer";

// Demo products for when Supabase is not configured
const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-1",
    title: "Viltrumite White Compression",
    description: "Premium white compression shirt with reinforced shoulder panels and moisture-wicking technology.",
    price: 450,
    image_url: "/products/Screenshot 2026-04-09 135734.png",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Viltrumite Black Compression",
    description: "Stealth black compression shirt with mesh ventilation panels and ergonomic muscle mapping.",
    price: 450,
    image_url: "/products/Screenshot 2026-04-09 140204.png",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    title: "Viltrumite White Pro",
    description: "Professional-grade white compression with back support technology and athletic fit.",
    price: 500,
    image_url: "/products/Screenshot 2026-04-09 135833.png",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    title: "Viltrumite Black Elite",
    description: "Elite black compression with reinforced back panel and maximum support structure.",
    price: 500,
    image_url: "/products/Screenshot 2026-04-09 140240.png",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-5",
    title: "Viltrumite Training Tee",
    description: "Versatile training compression with side-logo branding and flexible body-mapped panels.",
    price: 400,
    image_url: "/products/Screenshot 2026-04-09 140043.png",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function HomePage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setProducts(data);
        }
      } catch {
        // Use demo products if Supabase is not configured
        console.log("Using demo products");
      }
    }
    fetchProducts();
  }, []);

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <main>
        <HeroSection />
        <ProductGrid products={products} />
      </main>
      <Footer />
    </>
  );
}
