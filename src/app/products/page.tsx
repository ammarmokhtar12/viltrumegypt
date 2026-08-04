import type { Metadata } from "next";
import ProductsPageClient from "@/app/products/ProductsPageClient";
import { getActiveProductsCached } from "@/lib/products.server";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "The Archive — VILTRUM EGYPT",
  description:
    "Browse the full Viltrum compression gear collection. Premium athletic wear forged for heroes.",
  openGraph: {
    title: "The Archive — VILTRUM EGYPT",
    description: "Browse the full Viltrum compression gear collection.",
    type: "website",
    images: [{ url: "/viltrum-logo.png", width: 512, height: 512, alt: "Viltrum Egypt" }],
  },
};

export default async function ProductsPage() {
  const initial = await getActiveProductsCached();
  return <ProductsPageClient initial={initial} />;
}
