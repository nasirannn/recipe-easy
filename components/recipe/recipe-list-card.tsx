"use client";

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChefHat, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getImageUrl } from '@/lib/config';
import { Recipe } from '@/lib/types';
import { cn } from '@/lib/utils';

type RecipeListItem = Pick<
  Recipe,
  'id' | 'title' | 'description' | 'imagePath' | 'cookingTime' | 'servings' | 'difficulty'
>;

interface RecipeListCardProps {
  recipe: RecipeListItem;
  href: string;
  minsLabel: string;
  difficultyLabel?: string;
  difficultyBadgeClassName?: string;
  topLeftContent?: ReactNode;
  topRightContent?: ReactNode;
  featured?: boolean;
  mediaClassName?: string;
  layout?: 'standard' | 'overlay';
  className?: string;
  prefetch?: boolean;
}

export const RecipeListCard = ({
  recipe,
  href,
  minsLabel,
  difficultyLabel,
  difficultyBadgeClassName,
  topLeftContent,
  topRightContent,
  featured = false,
  mediaClassName,
  layout = 'standard',
  className,
  prefetch = true,
}: RecipeListCardProps) => {
  const imageSrc = getImageUrl(recipe.imagePath) || '/images/recipe-placeholder-bg.png';
  const mediaClasses = mediaClassName ?? (featured ? 'aspect-[16/8]' : 'aspect-[4/3]');

  const difficultyClassName = difficultyBadgeClassName
    ? cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 ring-1', difficultyBadgeClassName)
    : 'inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2.5 py-1';

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-border/75 bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/12 focus-within:ring-2 focus-within:ring-primary/55 focus-within:ring-offset-2 focus-within:ring-offset-background',
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
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              layout === 'overlay'
                ? 'bg-linear-to-t from-slate-950/92 via-slate-950/42 to-slate-950/12 opacity-95 group-hover:opacity-70'
                : 'bg-linear-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-75 group-hover:opacity-55'
            )}
          />
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
                'line-clamp-2 font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_1px_rgba(2,6,23,0.7)]',
                featured ? 'text-2xl' : 'text-xl'
              )}
            >
              {recipe.title}
            </h3>

            {recipe.description ? (
              <p className="mt-2 line-clamp-1 text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_1px_rgba(2,6,23,0.55)]">
                {recipe.description}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/90">
              {recipe.cookingTime ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-slate-950/35 px-2.5 py-1 backdrop-blur-sm">
                  <Clock className="h-3.5 w-3.5" />
                  {recipe.cookingTime} {minsLabel}
                </span>
              ) : null}

              {recipe.servings ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-slate-950/35 px-2.5 py-1 backdrop-blur-sm">
                  <Users className="h-3.5 w-3.5" />
                  <span>{recipe.servings}</span>
                </span>
              ) : null}

              {difficultyLabel ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-slate-950/35 px-2.5 py-1 backdrop-blur-sm">
                  <ChefHat className="h-3.5 w-3.5" />
                  {difficultyLabel}
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
              'line-clamp-2 font-semibold leading-snug tracking-tight text-foreground',
              featured ? 'text-2xl' : 'text-xl'
            )}
          >
            <Link
              href={href}
              className="block cursor-pointer transition-colors hover:text-primary"
              prefetch={prefetch}
            >
              {recipe.title}
            </Link>
          </h3>

          {recipe.description ? (
            <p className="line-clamp-1 text-sm leading-relaxed text-muted-foreground">
              {recipe.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
            {recipe.cookingTime ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2.5 py-1">
                <Clock className="h-3.5 w-3.5" />
                {recipe.cookingTime} {minsLabel}
              </span>
            ) : null}

            {recipe.servings ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2.5 py-1">
                <Users className="h-3.5 w-3.5" />
                <span>{recipe.servings}</span>
              </span>
            ) : null}

            {difficultyLabel ? (
              <span className={difficultyClassName}>
                <ChefHat className="h-3.5 w-3.5" />
                {difficultyLabel}
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
        'overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-sm',
        className
      )}
    >
      <div className={cn('relative', mediaClasses)}>
        <Skeleton className="h-full w-full rounded-none" />
        {layout === 'overlay' ? (
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 sm:p-5">
            <Skeleton className="h-5 w-4/5 bg-white/25" />
            <Skeleton className="h-4 w-3/5 bg-white/20" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
              <Skeleton className="h-6 w-16 rounded-full bg-white/20" />
            </div>
          </div>
        ) : null}
      </div>
      {layout === 'standard' ? (
        <div className="space-y-3 p-5 sm:p-6">
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-11/12" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ) : null}
    </Card>
  );
};
