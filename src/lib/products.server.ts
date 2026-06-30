import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { ProductsFetchResult } from "@/lib/products";
import { Product } from "@/types";

/** Columns needed for store listing — avoids pulling large unused fields */
const LIST_SELECT =
  "id,title,description,price,image_url,gallery_urls,video_url,sizes,is_active,created_at,updated_at";

async function loadActiveProducts(): Promise<ProductsFetchResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return {
      ok: false,
      error: "not_configured",
      message:
        "Store database is not connected. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.",
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(LIST_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, error: "fetch_failed", message: error.message };
    }

    return { ok: true, products: (data ?? []) as Product[] };
  } catch (err) {
    return {
      ok: false,
      error: "fetch_failed",
      message: err instanceof Error ? err.message : "Could not load products.",
    };
  }
}

/** Cached on the server — repeat visits are instant for ~2 minutes */
export const getActiveProductsCached = unstable_cache(
  loadActiveProducts,
  ["viltrum-active-products"],
  { revalidate: 120, tags: ["products"] }
);
