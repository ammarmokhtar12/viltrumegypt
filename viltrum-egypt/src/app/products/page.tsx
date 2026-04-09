"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import CartDrawer from "@/components/cart/CartDrawer";

// Same demo products from homepage
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

export default function ProductsPage() {
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
        console.log("Using demo products");
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12 lg:gap-16">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
