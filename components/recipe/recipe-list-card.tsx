"use client";

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChefHat, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getImageUrl } from '@/lib/config';
import { cn } from '@/lib/utils';

type RecipeListItem = {
  id: string;
  title: string;
  description?: string;
  imagePath?: string;
  cookingTime?: number;
  servings?: number;
  vibe?: string;
};

type VibeTone = 'quick' | 'comfort' | 'gourmet' | 'healthy';

function normalizeVibe(value?: string): VibeTone {
  const normalized = (value || '').trim().toLowerCase();
  if (
    normalized.includes('quick') ||
    normalized.includes('easy') ||
    normalized.includes('简单') ||
    normalized.includes('快手') ||
    normalized.includes('快速')
  ) {
    return 'quick';
  }
  if (
    normalized.includes('gourmet') ||
    normalized.includes('hard') ||
    normalized.includes('困难') ||
    normalized.includes('精致')
  ) {
    return 'gourmet';
  }
  if (
    normalized.includes('healthy') ||
    normalized.includes('健康') ||
    normalized.includes('清淡')
  ) {
    return 'healthy';
  }
  return 'comfort';
}

function getVibeBadgeToneClass(
  value: string | undefined,
  variant: 'standard' | 'overlay'
): string {
  const tone = normalizeVibe(value);

  if (variant === 'overlay') {
    switch (tone) {
      case 'quick':
        return 'text-primary';
      case 'gourmet':
        return 'text-destructive';
      case 'healthy':
        return 'text-emerald-300';
      case 'comfort':
      default:
        return 'text-secondary';
    }
  }

  switch (tone) {
    case 'quick':
      return 'text-primary';
    case 'gourmet':
      return 'text-destructive';
    case 'healthy':
      return 'text-emerald-600 dark:text-emerald-300';
    case 'comfort':
    default:
      return 'text-secondary';
  }
}

interface RecipeListCardProps {
  recipe: RecipeListItem;
  href: string;
  minsLabel: string;
  vibeLabel?: string;
  vibeBadgeClassName?: string;
  topLeftContent?: ReactNode;
  topRightContent?: ReactNode;
  featured?: boolean;
  mediaClassName?: string;
  layout?: 'standard' | 'overlay';
  showCoverOverlay?: boolean;
  showDescription?: boolean;
  className?: string;
  prefetch?: boolean;
}

export const RecipeListCard = ({
  recipe,
  href,
  minsLabel,
  vibeLabel,
  vibeBadgeClassName,
  topLeftContent,
  topRightContent,
  featured = false,
  mediaClassName,
  layout = 'standard',
  showCoverOverlay = true,
  showDescription = true,
  className,
  prefetch = true,
}: RecipeListCardProps) => {
  const imageSrc = getImageUrl(recipe.imagePath) || '/images/recipe-placeholder-bg.png';
  const mediaClasses = mediaClassName ?? (featured ? 'aspect-[16/8]' : 'aspect-[4/3]');
  const vibeValue = recipe.vibe || vibeLabel;

  const vibeClassName = vibeBadgeClassName
    ? cn('inline-flex items-center gap-1 font-semibold', vibeBadgeClassName)
    : cn(
        'inline-flex items-center gap-1 font-semibold',
        getVibeBadgeToneClass(vibeValue, 'standard')
      );

  const overlayVibeClassName = vibeBadgeClassName
    ? cn('inline-flex items-center gap-1 font-semibold', vibeBadgeClassName)
    : cn(
        'inline-flex items-center gap-1 font-semibold',
        getVibeBadgeToneClass(vibeValue, 'overlay')
      );

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-recipe-surface-border bg-recipe-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/12 focus-within:ring-2 focus-within:ring-primary/55 focus-within:ring-offset-2 focus-within:ring-offset-recipe-surface-focus-offset',
        className
      )}
    >
      <div className={cn('relative overflow-hidden', mediaClasses)}>
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
            sizes={
              featured
                ? '(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 66vw'
                : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            }
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            unoptimized={true}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/images/recipe-placeholder-bg.png';
            }}
          />
          {showCoverOverlay ? (
            <div
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                layout === 'overlay'
                  ? 'bg-[linear-gradient(to_top,var(--color-recipe-overlay-strong)_0%,var(--color-recipe-overlay-mid)_24%,transparent_52%)] opacity-92 group-hover:opacity-84'
                  : 'bg-linear-to-t from-recipe-overlay-strong via-recipe-overlay-mid to-transparent opacity-78 group-hover:opacity-58'
              )}
            />
          ) : null}
        </Link>

        {topLeftContent ? (
          <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2">
            {topLeftContent}
          </div>
        ) : null}

        {topRightContent ? (
          <div className="absolute right-3 top-3 z-30">
            {topRightContent}
          </div>
        ) : null}

        {layout === 'overlay' ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 sm:p-5">
            <h3
              className={cn(
                'line-clamp-2 font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_1px_rgba(10,24,15,0.72)] transition-colors duration-200 group-hover:text-primary',
                featured ? 'text-2xl' : 'text-xl'
              )}
            >
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

              {recipe.cookingTime && recipe.servings ? (
                <span className="h-1 w-1 rounded-full bg-white/58" aria-hidden="true" />
              ) : null}

              {recipe.servings ? (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Users className="h-3.5 w-3.5" />
                  <span>{recipe.servings}</span>
                </span>
              ) : null}

              {(recipe.cookingTime || recipe.servings) && vibeLabel ? (
                <span className="h-1 w-1 rounded-full bg-white/58" aria-hidden="true" />
              ) : null}

              {vibeLabel ? (
                <span className={overlayVibeClassName}>
                  <ChefHat className="h-3.5 w-3.5" />
                  {vibeLabel}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {layout === 'standard' ? (
        <div className="space-y-4 p-5 sm:p-6">
          <h3
            className={cn(
              'line-clamp-2 font-semibold leading-snug tracking-tight text-recipe-surface-foreground transition-colors duration-200 group-hover:text-primary',
              featured ? 'text-2xl' : 'text-xl'
            )}
          >
            <Link
              href={href}
              className="block cursor-pointer"
              prefetch={prefetch}
            >
              {recipe.title}
            </Link>
          </h3>

          {showDescription && recipe.description ? (
            <p className="line-clamp-1 text-sm leading-relaxed text-recipe-surface-muted-foreground">
              {recipe.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-xs text-recipe-surface-muted-foreground">
            {recipe.cookingTime ? (
              <span className="inline-flex items-center gap-1 font-medium">
                <Clock className="h-3.5 w-3.5" />
                {recipe.cookingTime} {minsLabel}
              </span>
            ) : null}

            {recipe.cookingTime && recipe.servings ? (
              <span className="h-1 w-1 rounded-full bg-recipe-surface-skeleton-soft" aria-hidden="true" />
            ) : null}

            {recipe.servings ? (
              <span className="inline-flex items-center gap-1 font-medium">
                <Users className="h-3.5 w-3.5" />
                <span>{recipe.servings}</span>
              </span>
            ) : null}

            {(recipe.cookingTime || recipe.servings) && vibeLabel ? (
              <span className="h-1 w-1 rounded-full bg-recipe-surface-skeleton-soft" aria-hidden="true" />
            ) : null}

            {vibeLabel ? (
              <span className={vibeClassName}>
                <ChefHat className="h-3.5 w-3.5" />
                {vibeLabel}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
};

interface RecipeListCardSkeletonProps {
  featured?: boolean;
  mediaClassName?: string;
  layout?: 'standard' | 'overlay';
  className?: string;
}

export const RecipeListCardSkeleton = ({
  featured = false,
  mediaClassName,
  layout = 'standard',
  className,
}: RecipeListCardSkeletonProps) => {
  const mediaClasses = mediaClassName ?? (featured ? 'aspect-[16/8]' : 'aspect-[4/3]');
  return (
    <Card
      className={cn(
        'overflow-hidden rounded-3xl border border-recipe-surface-border bg-recipe-surface shadow-sm',
        className
      )}
    >
      <div className={cn('relative', mediaClasses)}>
        <Skeleton className="h-full w-full rounded-none" />
        {layout === 'overlay' ? (
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 sm:p-5">
            <Skeleton className="h-5 w-4/5 bg-recipe-surface-skeleton" />
            <Skeleton className="h-4 w-3/5 bg-recipe-surface-skeleton-soft" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-6 w-20 rounded-full bg-recipe-surface-skeleton-soft" />
              <Skeleton className="h-6 w-16 rounded-full bg-recipe-surface-skeleton-soft" />
            </div>
          </div>
        ) : null}
      </div>
      {layout === 'standard' ? (
        <div className="space-y-3 p-5 sm:p-6">
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-11/12" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-4 w-20 rounded-sm" />
            <Skeleton className="h-1 w-1 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-sm" />
            <Skeleton className="h-1 w-1 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-sm" />
          </div>
        </div>
      ) : null}
    </Card>
  );
};
