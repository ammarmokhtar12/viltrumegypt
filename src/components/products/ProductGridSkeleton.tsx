export default function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="group relative flex flex-col gap-5">
          {/* Image Skeleton */}
          <div
            className="relative overflow-hidden rounded-2xl bg-surface border border-border-light shadow-sm"
            style={{ aspectRatio: "4/5" }}
          >
            <div className="absolute inset-0 bg-secondary/10 animate-pulse" />
            
            {/* Skeleton Badges */}
            <div className="absolute left-4 top-4 h-5 w-16 bg-secondary/20 rounded-full animate-pulse" />
            <div className="absolute right-4 top-4 h-8 w-8 bg-secondary/20 rounded-full animate-pulse" />
          </div>

          {/* Info Skeleton */}
          <div className="flex flex-col gap-3 px-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 w-3/4 bg-secondary/20 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-secondary/10 rounded animate-pulse" />
              </div>
              <div className="h-4 w-1/4 bg-secondary/20 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
