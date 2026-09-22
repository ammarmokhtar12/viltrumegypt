import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ProductDetailSkeleton() {
  return (
    <>
      <Navbar onCartOpen={() => {}} />
      <main className="min-h-screen bg-background pt-32 sm:pt-44">
        {/* Back Button Skeleton */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8">
          <div className="h-4 w-32 bg-secondary/10 rounded animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-32 sm:pb-44">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
            
            {/* Gallery Skeleton */}
            <div className="lg:col-span-7 space-y-6">
              {/* Main Image */}
              <div
                className="relative overflow-hidden rounded-2xl bg-surface border border-border-light shadow-2xl"
                style={{ aspectRatio: "4/5" }}
              >
                <div className="absolute inset-0 bg-secondary/10 animate-pulse" />
              </div>

              {/* Thumbnails */}
              <div className="hidden sm:flex flex-wrap gap-4 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-24 rounded-xl bg-secondary/10 animate-pulse border-2 border-border-light" />
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="lg:col-span-5 flex flex-col pt-4">
              <div className="space-y-12">
                
                {/* Title & Price */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="h-3 w-24 bg-secondary/10 rounded animate-pulse" />
                    <div className="h-14 w-full bg-secondary/20 rounded animate-pulse" />
                    <div className="h-14 w-2/3 bg-secondary/20 rounded animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="h-4 w-12 bg-secondary/10 rounded animate-pulse" />
                    <div className="h-8 w-32 bg-secondary/20 rounded animate-pulse" />
                  </div>
                </div>

                <div className="h-px bg-border-light w-24" />

                {/* Configuration: Size */}
                <div className="space-y-5">
                  <div className="h-3 w-20 bg-secondary/10 rounded animate-pulse" />
                  <div className="flex flex-wrap gap-2.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-12 w-16 bg-secondary/10 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>

                {/* Configuration: Quantity */}
                <div className="space-y-5">
                  <div className="h-3 w-20 bg-secondary/10 rounded animate-pulse" />
                  <div className="h-14 w-36 bg-secondary/10 rounded-xl animate-pulse" />
                </div>

                {/* Main Action */}
                <div className="pt-4 flex gap-3">
                  <div className="flex-1 h-16 bg-secondary/20 rounded-2xl animate-pulse" />
                  <div className="w-16 h-16 bg-secondary/10 rounded-2xl animate-pulse" />
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
