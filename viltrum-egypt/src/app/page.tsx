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
    title: "Core White Compression",
    description: "Clean-cut white compression top with a body-contouring fit and premium stretch recovery.",
    price: 450,
    image_url: "/products/Screenshot 2026-04-09 135734.png",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Stealth Black Compression",
    description: "Matte black compression piece with sharp contrast lines and a stronger athletic silhouette.",
    price: 450,
    image_url: "/products/Screenshot 2026-04-09 140204.png",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    title: "White Pro Form",
    description: "Refined performance layer designed for locked-in sessions and a polished gym look.",
    price: 500,
    image_url: "/products/Screenshot 2026-04-09 135833.png",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    title: "Black Elite Form",
    description: "Premium black essential with a supportive fit, clean structure, and elevated visual finish.",
    price: 500,
    image_url: "/products/Screenshot 2026-04-09 140240.png",
    sizes: ["S", "M", "L", "XL", "XXL"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-5",
    title: "Training Essential Tee",
    description: "Versatile performance tee made to feel sharp, breathable, and ready for everyday training.",
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
