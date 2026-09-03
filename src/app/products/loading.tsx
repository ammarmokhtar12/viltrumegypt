import ProductGridSkeleton from "@/components/products/ProductGridSkeleton";

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-background pt-48 px-5 sm:px-8 lg:px-12 pb-32">
      <div className="mx-auto max-w-7xl">
        <div className="h-10 w-48 bg-surface rounded animate-pulse mb-12 mx-auto" />
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}
