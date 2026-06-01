import ProductsPageClient from "@/app/products/ProductsPageClient";
import { getActiveProductsCached } from "@/lib/products.server";

export const revalidate = 120;

export default async function ProductsPage() {
  const initial = await getActiveProductsCached();
  return <ProductsPageClient initial={initial} />;
}
