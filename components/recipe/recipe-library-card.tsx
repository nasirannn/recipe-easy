"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

type RecipeLibraryItem = {
  id: string;
  title: string;
  description?: string;
  imagePath?: string;
  cookingTime?: number;
  servings?: number;
  vibe?: string;
};

interface RecipeLibraryCardProps {
  recipe: RecipeLibraryItem;
  href: string;
  topRightAction?: ReactNode;
  imageHeightClassName?: string;
  className?: string;
  prefetch?: boolean;
}

export const RecipeLibraryCard = ({
  recipe,
  href,
  topRightAction,
  imageHeightClassName = "aspect-square",
  className,
  prefetch = true,
}: RecipeLibraryCardProps) => {
  const imageSrc = getImageUrl(recipe.imagePath) || "/images/recipe-placeholder-bg.png";

  return (
    <Card
      className={cn(
        "group relative self-start overflow-hidden rounded-2xl border border-recipe-surface-border bg-recipe-surface shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg hover:shadow-primary/10",
        className
      )}
    >
      <div className={cn("relative overflow-hidden", imageHeightClassName)}>
        <Link
          href={href}
          className="absolute inset-0 z-10 block cursor-pointer focus-visible:outline-none"
          prefetch={prefetch}
          aria-label={recipe.title}
        >
          <Image
            src={imageSrc}
            alt={recipe.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={true}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/images/recipe-placeholder-bg.png";
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-recipe-overlay-strong via-recipe-overlay-mid to-transparent" />
        </Link>

        {topRightAction ? (
          <div className="pointer-events-none absolute right-3 top-3 z-20 translate-y-1 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
            {topRightAction}
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-white drop-shadow-[0_2px_6px_rgba(10,24,15,0.72)]">
            <span>{recipe.title}</span>
          </h3>
        </div>
      </div>
    </Card>
  );
};

interface RecipeLibraryCardSkeletonProps {
  className?: string;
  imageHeightClassName?: string;
}

export const RecipeLibraryCardSkeleton = ({
  className,
  imageHeightClassName = "aspect-square",
}: RecipeLibraryCardSkeletonProps) => {
  return (
    <Card
      className={cn(
        "group relative self-start overflow-hidden rounded-2xl border border-recipe-surface-border bg-recipe-surface shadow-sm",
        className
      )}
    >
      <div className={cn("relative overflow-hidden", imageHeightClassName)}>
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute inset-0 bg-linear-to-t from-recipe-overlay-strong via-recipe-overlay-mid to-transparent" />

        <div className="absolute right-3 top-3 z-20">
          <Skeleton className="h-8 w-8 rounded-full bg-recipe-surface-skeleton-soft" />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 p-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-[88%] bg-recipe-surface-skeleton" />
            <Skeleton className="h-5 w-[62%] bg-recipe-surface-skeleton-soft" />
          </div>
        </div>
      </div>
    </Card>
  );
};
