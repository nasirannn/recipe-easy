"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChefHat, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

type RecipeCookbookItem = {
  id: string;
  title: string;
  description?: string;
  imagePath?: string;
  cookingTime?: number;
  servings?: number;
  vibe?: string;
};

type VibeTone = "quick" | "comfort" | "gourmet" | "healthy";

function normalizeVibe(value?: string): VibeTone {
  const normalized = (value || "").trim().toLowerCase();
  if (
    normalized.includes("quick") ||
    normalized.includes("easy") ||
    normalized.includes("简单") ||
    normalized.includes("快手") ||
    normalized.includes("快速")
  ) {
    return "quick";
  }
  if (
    normalized.includes("gourmet") ||
    normalized.includes("hard") ||
    normalized.includes("困难") ||
    normalized.includes("精致")
  ) {
    return "gourmet";
  }
  if (
    normalized.includes("healthy") ||
    normalized.includes("健康") ||
    normalized.includes("清淡")
  ) {
    return "healthy";
  }
  return "comfort";
}

function getCoverVibeTextClass(value?: string): string {
  switch (normalizeVibe(value)) {
    case "quick":
      return "text-primary";
    case "gourmet":
      return "text-destructive";
    case "healthy":
      return "text-emerald-500 dark:text-emerald-300";
    case "comfort":
    default:
      return "text-secondary";
  }
}

interface RecipeCookbookCardProps {
  recipe: RecipeCookbookItem;
  href: string;
  minsLabel: string;
  vibeLabel?: string;
  accentLabel?: string;
  topRightAction?: ReactNode;
  footerLabel?: string;
  footerActionLabel?: string;
  imageHeightClassName?: string;
  className?: string;
  prefetch?: boolean;
}

export const RecipeCookbookCard = ({
  recipe,
  href,
  minsLabel,
  vibeLabel,
  accentLabel,
  topRightAction,
  footerLabel,
  footerActionLabel,
  imageHeightClassName = "",
  className,
  prefetch = true,
}: RecipeCookbookCardProps) => {
  const imageSrc = getImageUrl(recipe.imagePath) || "/images/recipe-placeholder-bg.png";
  const vibeTextClassName = getCoverVibeTextClass(recipe.vibe || vibeLabel);

  return (
    <Card
      className={cn(
        "group relative self-start overflow-hidden rounded-xl border border-recipe-surface-border bg-recipe-surface shadow-lg shadow-primary/12 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10",
        className
      )}
    >
      <div className={cn("relative overflow-hidden", imageHeightClassName)}>
        <Link
          href={href}
          className="block cursor-pointer focus-visible:outline-none"
          prefetch={prefetch}
          aria-label={recipe.title}
        >
          <Image
            src={imageSrc}
            alt={recipe.title}
            width={1024}
            height={1024}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={true}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/images/recipe-placeholder-bg.png";
            }}
          />
        </Link>

        {topRightAction ? (
          <div className="pointer-events-none absolute right-3 top-3 z-20 translate-y-1 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
            {topRightAction}
          </div>
        ) : null}
      </div>

      <div className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-semibold uppercase tracking-wider text-primary">{accentLabel}</span>
          {recipe.cookingTime || vibeLabel ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 text-recipe-surface-muted-foreground">
              {recipe.cookingTime ? (
                <span className="inline-flex items-center gap-1 font-normal">
                  <Clock className="h-3.5 w-3.5" />
                  {recipe.cookingTime} {minsLabel}
                </span>
              ) : null}

              {recipe.cookingTime && vibeLabel ? (
                <span className="h-1 w-1 rounded-full bg-recipe-surface-muted-foreground" aria-hidden="true" />
              ) : null}

              {vibeLabel ? (
                <span className={cn("inline-flex items-center font-medium", vibeTextClassName)}>
                  {vibeLabel}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        <h3 className="truncate text-lg font-bold leading-snug tracking-tight text-recipe-surface-foreground transition-colors duration-200 group-hover:text-primary">
          <Link href={href} className="cursor-pointer" prefetch={prefetch}>
            {recipe.title}
          </Link>
        </h3>

        {recipe.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-recipe-surface-muted-foreground">
            {recipe.description}
          </p>
        ) : null}

        {footerActionLabel ? (
          <Link
            href={href}
            prefetch={prefetch}
            className="mt-auto inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-recipe-surface-button-border bg-recipe-surface-button px-3 py-2 text-sm font-medium text-recipe-surface-foreground transition-colors duration-200 hover:bg-recipe-surface-button-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-recipe-surface-focus-offset"
          >
            {footerActionLabel}
          </Link>
        ) : footerLabel ? (
          <div className="flex items-center gap-2 border-t border-recipe-surface-border pt-3 text-xs text-recipe-surface-muted-foreground">
            <ChefHat className="h-3.5 w-3.5 text-recipe-surface-muted-foreground" />
            <span className="truncate">{footerLabel}</span>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

interface RecipeCookbookCardSkeletonProps {
  className?: string;
  imageHeightClassName?: string;
}

export const RecipeCookbookCardSkeleton = ({
  className,
  imageHeightClassName = "aspect-square",
}: RecipeCookbookCardSkeletonProps) => {
  return (
    <Card
      className={cn(
        "group relative self-start overflow-hidden rounded-xl border border-recipe-surface-border bg-recipe-surface shadow-lg shadow-primary/12",
        className
      )}
    >
      <div className={cn("relative overflow-hidden", imageHeightClassName)}>
        <Skeleton className="h-full w-full rounded-none bg-recipe-surface-skeleton" />

        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full bg-recipe-surface-skeleton-soft" />
          <Skeleton className="h-8 w-8 rounded-full bg-recipe-surface-skeleton-soft" />
        </div>
      </div>

      <div className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <Skeleton className="h-3 w-24 rounded-sm bg-recipe-surface-skeleton" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-16 rounded-sm bg-recipe-surface-skeleton" />
            <Skeleton className="h-1 w-1 rounded-full bg-recipe-surface-skeleton-soft" />
            <Skeleton className="h-3 w-12 rounded-sm bg-recipe-surface-skeleton-soft" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-5 w-[90%] bg-recipe-surface-skeleton-soft" />
          <Skeleton className="h-5 w-[64%] bg-recipe-surface-skeleton" />
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full bg-recipe-surface-skeleton" />
          <Skeleton className="h-4 w-[72%] bg-recipe-surface-skeleton-soft" />
        </div>

        <Skeleton className="mt-auto h-9 w-full rounded-lg bg-recipe-surface-skeleton-soft" />
      </div>
    </Card>
  );
};
