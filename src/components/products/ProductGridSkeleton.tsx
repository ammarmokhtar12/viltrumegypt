export default function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-x-10 md:gap-y-16">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-2xl bg-surface border border-border-light" />
          <div className="mt-8 mx-auto h-4 w-32 bg-surface rounded" />
          <div className="mt-3 mx-auto h-3 w-20 bg-surface rounded" />
        </div>
      ))}
    </div>
  );
}
