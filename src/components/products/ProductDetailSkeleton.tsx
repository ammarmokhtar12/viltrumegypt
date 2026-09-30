import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function Shimmer({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative overflow-hidden bg-secondary/10 ${className}`} style={style}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export default function ProductDetailSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
      <Navbar onCartOpen={() => {}} />
      <main className="min-h-screen bg-background pt-32 sm:pt-44">

        {/* Back Button Skeleton */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8">
          <Shimmer className="h-4 w-36 rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-32 sm:pb-44">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">

            {/* Gallery Skeleton */}
            <div className="lg:col-span-7 space-y-5">
              {/* Main Image */}
              <Shimmer
                className="w-full rounded-2xl border border-border-light shadow-2xl"
                style={{ aspectRatio: "4/5" } as React.CSSProperties}
              />

              {/* Dot indicators */}
              <div className="flex justify-center items-center gap-2">
                <div className="w-5 h-2 rounded-full bg-secondary/30" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-secondary/15" />
                ))}
              </div>

              {/* Thumbnails */}
              <div className="hidden sm:flex gap-3 overflow-x-auto">
                {[1, 2, 3, 4].map((i) => (
                  <Shimmer key={i} className="flex-shrink-0 w-24 aspect-square rounded-2xl border-2 border-border-light" />
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="lg:col-span-5 flex flex-col pt-4">
              <div className="space-y-12">

                {/* Title & Price */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Shimmer className="h-3 w-28 rounded-full" />
                    <Shimmer className="h-14 w-full rounded-xl" />
                    <Shimmer className="h-14 w-2/3 rounded-xl" />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <Shimmer className="h-4 w-12 rounded-full" />
                    <Shimmer className="h-9 w-36 rounded-lg" />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Shimmer className="h-3.5 w-full rounded-full" />
                  <Shimmer className="h-3.5 w-4/5 rounded-full" />
                  <Shimmer className="h-3.5 w-3/5 rounded-full" />
                </div>

                <div className="h-px bg-border-light w-24" />

                {/* Size Selector */}
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <Shimmer className="h-3 w-20 rounded-full" />
                    <Shimmer className="h-3 w-28 rounded-full" />
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Shimmer key={i} className="h-12 w-16 rounded-xl" />
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-5">
                  <Shimmer className="h-3 w-20 rounded-full" />
                  <Shimmer className="h-14 w-40 rounded-xl" />
                </div>

                {/* Add to Cart */}
                <div className="pt-4 flex gap-3">
                  <Shimmer className="flex-1 h-16 rounded-2xl" />
                  <Shimmer className="w-16 h-16 rounded-2xl" />
                </div>

                {/* Assurance */}
                <div className="pt-4 border-t border-border-light flex items-center gap-4">
                  <Shimmer className="w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Shimmer className="h-3 w-24 rounded-full" />
                    <Shimmer className="h-3 w-48 rounded-full" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
