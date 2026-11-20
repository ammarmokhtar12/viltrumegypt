import { Product } from "@/types";

/**
 * Priority for Best Sellers:
 * 1: Spider-Man Long Sleeve
 * 2: Superior Spider Man Long Sleeve
 * 3: Night Wing (Long Sleeve preferred, or Night Wing)
 */
export function getProductPriority(title: string): number {
  const norm = (title || "").toUpperCase().replace(/\s+/g, " ").trim();

  // 1: Spider-Man Long Sleeve (regular Spider-Man, not Superior)
  if (
    norm.includes("SPIDER-MAN LONG") ||
    (norm.includes("SPIDER") && norm.includes("LONG") && !norm.includes("SUPERIOR"))
  ) {
    return 1;
  }

  // 2: Superior Spider Man Long Sleeve
  if (norm.includes("SUPERIOR") && (norm.includes("LONG") || norm.includes("SPIDER MAN - LONG"))) {
    return 2;
  }

  // 3: Night Wing (Long Sleeve preferred, or Night Wing)
  if (norm.includes("NIGHT WING") || norm.includes("NIGHTWING")) {
    return norm.includes("LONG") ? 3 : 3.5;
  }

  return 99;
}

export function isBestSeller(title: string): boolean {
  return getProductPriority(title) <= 3.5;
}

export function sortProductsWithBestSellers(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const prioA = getProductPriority(a.title);
    const prioB = getProductPriority(b.title);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}
