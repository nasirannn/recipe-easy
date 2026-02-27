"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { ChefHat, Clock, Sparkles, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { Recipe } from '@/lib/types';
import { getImageUrl } from '@/lib/config';

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

function normalizeDifficulty(value?: string): Exclude<DifficultyFilter, 'all'> {
  const normalized = (value || '').toLowerCase();
  if (normalized === '简单' || normalized.includes('easy')) return 'easy';
  if (normalized === '困难' || normalized.includes('hard')) return 'hard';
  return 'medium';
}

function getDifficultyTone(value: Exclude<DifficultyFilter, 'all'>): string {
  if (value === 'easy') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-400/30';
  }
  if (value === 'hard') {
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:ring-rose-400/30';
  }
  return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-400/30';
}

interface RecipesListProps {
  locale: string;
}

export const RecipesList = ({ locale }: RecipesListProps) => {
  const t = useTranslations('recipes');
  const tRecipe = useTranslations('recipeDisplay');
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyFilter>('all');

  const uiText = locale === 'zh'
      ? {
        deck: '探索菜谱库',
        filterLabel: '难度筛选',
        allLabel: '全部',
        emptyFilterTitle: '当前筛选暂无菜谱',
        clearFilter: '清除筛选',
        subtitleExtra: '按难度与份量快速筛选，结合详细步骤与食材信息，快速找到适合当前场景的可执行菜谱。',
      }
    : {
        deck: 'Explore Recipe Library',
        filterLabel: 'Filter By Difficulty',
        allLabel: 'All',
        emptyFilterTitle: 'No recipes match this filter',
        clearFilter: 'Clear Filter',
        subtitleExtra: 'Filter by difficulty and servings, then jump into practical recipes with clear steps and ingredients tailored to your current cooking context.',
      };

  // 从本地 API 获取食谱数据
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/recipes?type=all&page=${page}&limit=20&lang=${locale}`);
        const data = await response.json() as any;

        if (data.success) {
          // 转换API返回的数据格式以匹配前端期望的格式
          const transformedRecipes = (data.results || []).map((recipe: any) => ({
            id: recipe.id,
            title: recipe.title,
            imagePath: recipe.imagePath,
            description: recipe.description,
            tags: recipe.tags || [],
            cookingTime: recipe.cookingTime || 30,
            servings: recipe.servings || 4,
            difficulty: recipe.difficulty || 'easy',
            ingredients: recipe.ingredients || [],
            seasoning: recipe.seasoning || [],
            instructions: recipe.instructions || [],
            chefTips: recipe.chefTips || [],
            cuisine: recipe.cuisine ? {
              id: recipe.cuisine.id,
              name: recipe.cuisine.name
            } : undefined
          }));
          
          if (page === 1) {
            setRecipes(transformedRecipes);
          } else {
            setRecipes(prev => [...prev, ...transformedRecipes]);
          }
          
          setHasMore(transformedRecipes.length === 20);
        } else {
          // Failed to fetch recipes
        }
      } catch (error) {
        // Error fetching recipes
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [locale, page]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const difficultyCounts: Record<Exclude<DifficultyFilter, 'all'>, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  recipes.forEach((recipe) => {
    const normalized = normalizeDifficulty(recipe.difficulty);
    difficultyCounts[normalized] += 1;
  });

  const difficultyFilters: Array<{ key: DifficultyFilter; label: string; count: number }> = [
    { key: 'all', label: uiText.allLabel, count: recipes.length },
    { key: 'easy', label: tRecipe('easy'), count: difficultyCounts.easy },
    { key: 'medium', label: tRecipe('medium'), count: difficultyCounts.medium },
    { key: 'hard', label: tRecipe('hard'), count: difficultyCounts.hard },
  ];

  const filteredRecipes = activeDifficulty === 'all'
    ? recipes
    : recipes.filter((recipe) => normalizeDifficulty(recipe.difficulty) === activeDifficulty);

  if (isLoading && page === 1) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/20" />
          <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/20" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="mb-10 text-center">
            <span className="inline-flex h-9 items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50 px-4 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-100">
              <Sparkles className="h-3.5 w-3.5" />
              {uiText.deck}
            </span>

            <h1 className="mx-auto mt-5 max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl md:leading-[1.1]">
              {t('title')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {t('subtitle')}
            </p>
            <p className="mx-auto mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {uiText.subtitleExtra}
            </p>
          </section>

          <section className="mb-8">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {uiText.filterLabel}
            </div>
            <div className="flex flex-wrap gap-2">
              {difficultyFilters.map((filter) => {
                const active = activeDifficulty === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    disabled
                    aria-pressed={active}
                    className={`inline-flex h-11 cursor-not-allowed items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all duration-200 opacity-80 ${
                      active
                        ? 'border-foreground bg-foreground text-background shadow-lg shadow-foreground/20 dark:shadow-none'
                        : 'border-border bg-card text-foreground'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      active
                        ? 'bg-background/20 text-background'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`recipe-card-skeleton-${index}`}
                className={`overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-md ${
                  index === 0 ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <Skeleton className="aspect-[3/2] w-full rounded-none" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/5" />
                  <Skeleton className="h-6 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-3 pt-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="mb-10 text-center">
          <span className="inline-flex h-9 items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50 px-4 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-100">
            <Sparkles className="h-3.5 w-3.5" />
            {uiText.deck}
          </span>

          <h1 className="mx-auto mt-5 max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl md:leading-[1.1]">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t('subtitle')}
          </p>
          <p className="mx-auto mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {uiText.subtitleExtra}
          </p>
        </section>

        <section className="mb-8">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {uiText.filterLabel}
          </div>
          <div className="flex flex-wrap gap-2">
            {difficultyFilters.map((filter) => {
              const active = activeDifficulty === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveDifficulty(filter.key)}
                  aria-pressed={active}
                  className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    active
                      ? 'border-foreground bg-foreground text-background shadow-lg shadow-foreground/20 dark:shadow-none'
                      : 'border-border bg-card text-foreground hover:border-border/90 hover:bg-muted'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    active
                      ? 'bg-background/20 text-background'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {filteredRecipes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/80 p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-foreground">{uiText.emptyFilterTitle}</p>
            <button
              type="button"
              onClick={() => setActiveDifficulty('all')}
              className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {uiText.clearFilter}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe, index) => {
              const normalizedDifficulty = normalizeDifficulty(recipe.difficulty);
              const isFeatured = index === 0;

              return (
                <Link
                  key={recipe.id}
                  href={`/${locale}/recipe/${recipe.id}`}
                  className={`group relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-md shadow-black/8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:shadow-black/30 dark:hover:shadow-black/40 ${
                    isFeatured ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <div className={`relative overflow-hidden ${isFeatured ? 'aspect-[16/8]' : 'aspect-[4/3]'}`}>
                    <Image
                      src={getImageUrl(recipe.imagePath) || '/images/recipe-placeholder-bg.png'}
                      alt={recipe.title}
                      fill
                      sizes={isFeatured
                        ? '(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 66vw'
                        : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized={true}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/images/recipe-placeholder-bg.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

                    <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getDifficultyTone(normalizedDifficulty)}`}>
                        {tRecipe(normalizedDifficulty)}
                      </span>
                      {recipe.cuisine?.name && (
                        <span className="inline-flex items-center rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
                          {recipe.cuisine.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 md:p-6">
                    <h3 className={`font-semibold leading-tight text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300 ${
                      isFeatured ? 'text-2xl' : 'text-xl'
                    }`}>
                      {recipe.title}
                    </h3>

                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {recipe.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {recipe.cookingTime && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {recipe.cookingTime} {tRecipe('mins')}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {recipe.servings}
                        </span>
                      )}
                      {recipe.difficulty && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5">
                          <ChefHat className="h-3.5 w-3.5" />
                          {tRecipe(normalizedDifficulty)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="inline-flex h-12 cursor-pointer items-center rounded-full bg-foreground px-7 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('loadingRecipes')}
                </>
              ) : (
                t('loadMore')
              )}
            </button>
          </div>
        )}

        {!hasMore && recipes.length > 0 && (
          <div className="mt-12 border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">{t('allRecipesDisplayed')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
