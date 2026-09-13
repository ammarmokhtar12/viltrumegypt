"use client";

import { Product } from "@/types";
import Link from "next/link";

interface PromoCountdownBannerProps {
  products: Product[];
}

export default function PromoCountdownBanner({ products }: PromoCountdownBannerProps) {
  // Find the product named "LIMITED OFFER" (case-insensitive) for the CTA link
  const promoProduct = products.find(
    (p) => p.title.toUpperCase() === "LIMITED OFFER" && p.is_active
  );

  const ctaHref = promoProduct ? `/products/${promoProduct.id}` : "#";

  return (
    <section className="w-full py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Banner image — plain img tag for maximum compatibility */}
        <Link
          href={ctaHref}
          className="block relative w-full rounded-2xl overflow-hidden shadow-xl border border-border-light group"
          style={{ display: "block" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bundle-offer-banner.png"
            alt="Bundle Offer"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Link>

      </div>
    </section>
  );
}
