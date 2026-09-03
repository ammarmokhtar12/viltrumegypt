import HomePageClient from "@/app/HomePageClient";
import { getActiveProductsCached } from "@/lib/products.server";

export const revalidate = 120;

export default async function HomePage() {
  const initial = await getActiveProductsCached();
  return <HomePageClient initial={initial} />;
}
