import { Skeleton } from "@/components/ui/skeleton";

export default function RecipeDetailLoading() {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 md:px-10 lg:pb-16">
        <section className="mb-8 overflow-hidden rounded-xl">
          <Skeleton className="h-[380px] w-full sm:h-[420px]" />
        </section>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`recipe-detail-stat-skeleton-${index}`} className="h-20 w-full rounded-xl" />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-10 w-56 rounded-xl" />
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-40 rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
