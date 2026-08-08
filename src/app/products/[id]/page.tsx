import type { Metadata } from "next";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  if (!isSupabaseConfigured) {
    return { title: "Product — VILTRUM EGYPT" };
  }

  const { data } = await supabase
    .from("products")
    .select("title, description, price, image_url")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: "Product Not Found — VILTRUM EGYPT" };
  }

  const title = `${data.title} — VILTRUM EGYPT`;
  const description = data.description || `Shop ${data.title} from Viltrum Egypt. Premium compression gear.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: data.image_url
        ? [{ url: data.image_url, width: 800, height: 1000, alt: data.title }]
        : [{ url: "/viltrum-logo.png", width: 512, height: 512, alt: "Viltrum Egypt" }],
    },
  };
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
