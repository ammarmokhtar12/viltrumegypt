import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Product } from "@/types";

export type ProductsFetchError = "not_configured" | "fetch_failed";

export type ProductsFetchResult =
  | { ok: true; products: Product[] }
  | { ok: false; error: ProductsFetchError; message: string };

export async function fetchActiveProducts(): Promise<ProductsFetchResult> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      error: "not_configured",
      message:
        "Store database is not connected. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        ok: false,
        error: "fetch_failed",
        message: error.message,
      };
    }

    return { ok: true, products: data ?? [] };
  } catch (err) {
    return {
      ok: false,
      error: "fetch_failed",
      message: err instanceof Error ? err.message : "Could not load products.",
    };
  }
}

export function getProductsErrorMessage(error: ProductsFetchError): string {
  if (error === "not_configured") {
    return "Store is not connected to the database yet.";
  }
  return "We could not load the collection. Please try again shortly.";
}
