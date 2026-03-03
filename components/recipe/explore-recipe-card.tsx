"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChefHat, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getImageUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

type ExploreRecipeItem = {
  id: string;
  title: string;
  description?: string;
  imagePath?: string;
  cookingTime?: number;
  vibe?: string;
};

interface ExploreRecipeCardProps {
  recipe: ExploreRecipeItem;
  href: string;
  minsLabel: string;
  vibeLabel?: string;
  metaRightLabel?: string;
  vibeBadgeClassName?: string;
  topRightContent?: ReactNode;
  mediaClassName?: string;
  showCoverOverlay?: boolean;
  showDescription?: boolean;
  className?: string;
  prefetch?: boolean;
}

export const ExploreRecipeCard = ({
  recipe,
  href,
  minsLabel,
  vibeLabel,
  metaRightLabel,
  vibeBadgeClassName,
  topRightContent,
  mediaClassName,
  showCoverOverlay = true,
  showDescription = true,
  className,
  prefetch = true,
}: ExploreRecipeCardProps) => {
  const imageSrc = getImageUrl(recipe.imagePath) || "/images/recipe-placeholder-bg.png";
  const mediaClasses = mediaClassName ?? "aspect-[4/3]";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-recipe-surface-border bg-recipe-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/12 focus-within:ring-2 focus-within:ring-primary/55 focus-within:ring-offset-2 focus-within:ring-offset-recipe-surface-focus-offset",
        className
      )}
    >
      <div className={cn("relative overflow-hidden", mediaClasses)}>
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
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            unoptimized={true}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/images/recipe-placeholder-bg.png";
            }}
          />
          {showCoverOverlay ? (
            <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-recipe-overlay-strong)_0%,var(--color-recipe-overlay-mid)_24%,transparent_52%)] opacity-92 transition-opacity duration-300 group-hover:opacity-84" />
          ) : null}
        </Link>

        {topRightContent ? (
          <div className="absolute right-3 top-3 z-30">{topRightContent}</div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 sm:p-5">
          <h3 className="line-clamp-2 text-xl font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_1px_rgba(10,24,15,0.72)] transition-colors duration-200 group-hover:text-primary">
            {recipe.title}
          </h3>

          {showDescription && recipe.description ? (
            <p className="mt-2 line-clamp-1 text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_1px_rgba(10,24,15,0.6)]">
              {recipe.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/90 drop-shadow-[0_1px_1px_rgba(10,24,15,0.62)]">
            {recipe.cookingTime ? (
              <span className="inline-flex items-center gap-1 font-medium">
                <Clock className="h-3.5 w-3.5" />
                {recipe.cookingTime} {minsLabel}
              </span>
            ) : null}

            {recipe.cookingTime && vibeLabel ? (
              <span className="h-1 w-1 rounded-full bg-white/58" aria-hidden="true" />
            ) : null}

            {vibeLabel ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold",
                  vibeBadgeClassName ?? "text-white/90"
                )}
              >
                <ChefHat className="h-3.5 w-3.5" />
                {vibeLabel}
              </span>
            ) : null}

            {vibeLabel && metaRightLabel ? (
              <span className="h-1 w-1 rounded-full bg-white/58" aria-hidden="true" />
            ) : null}

            {metaRightLabel ? (
              <span className="truncate font-semibold text-white/90">{metaRightLabel}</span>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
};
