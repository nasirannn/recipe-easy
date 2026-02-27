"use client";
import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { RecipeListCard, RecipeListCardSkeleton } from '@/components/recipe/recipe-list-card';

import { Recipe } from '@/lib/types';
import { withLocalePath } from '@/lib/utils/locale-path';

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';
const masonryMediaClasses = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-[5/6]', 'aspect-square', 'aspect-[10/13]'] as const;

function normalizeDifficulty(value?: string): Exclude<DifficultyFilter, 'all'> {
  const normalized = (value || '').toLowerCase();
  if (normalized === '简单' || normalized.includes('easy')) return 'easy';
  if (normalized === '困难' || normalized.includes('hard')) return 'hard';
  return 'medium';
}

function getMasonryMediaClass(seed: string | number): string {
  const source = String(seed);
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return masonryMediaClasses[hash % masonryMediaClasses.length];
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
        filterLabel: '难度筛选',
        allLabel: '全部',
        emptyFilterTitle: '当前筛选暂无菜谱',
        emptyFilterHint: '可以切换筛选条件，查看更多菜谱。',
        clearFilter: '清除筛选',
        loadedLabel: '已加载',
      }
    : {
        filterLabel: 'Filter By Difficulty',
        allLabel: 'All',
        emptyFilterTitle: 'No recipes match this filter',
        emptyFilterHint: 'Try a different filter to explore more recipes.',
        clearFilter: 'Clear Filter',
        loadedLabel: 'Loaded',
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

  const renderHeader = (disabled = false) => (
    <header className="mb-6 space-y-4 sm:mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('subtitle')}
          </p>
        </div>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3.5 text-sm text-muted-foreground">
          <span className="font-medium">{uiText.loadedLabel}</span>
          <span className="font-semibold text-foreground tabular-nums">{recipes.length}</span>
        </span>
      </div>

      <section className="rounded-2xl border border-border/70 bg-card/90 p-3 sm:p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {uiText.filterLabel}
        </div>
        <div className="flex flex-wrap gap-2">
          {difficultyFilters.map((filter) => {
            const active = activeDifficulty === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={disabled ? undefined : () => setActiveDifficulty(filter.key)}
                disabled={disabled}
                aria-pressed={active}
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : `border-border bg-background text-foreground${disabled ? '' : ' hover:bg-muted'}`
                } ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
              >
                <span>{filter.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? 'bg-primary-foreground/15 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </header>
  );

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {renderHeader(true)}

          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <RecipeListCardSkeleton
                key={`recipe-card-skeleton-${index}`}
                layout="overlay"
                mediaClassName={getMasonryMediaClass(index)}
                className="mb-6 break-inside-avoid"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {renderHeader()}

        {filteredRecipes.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-border/70 bg-card p-8 text-center sm:p-10">
            <p className="text-xl font-semibold tracking-tight text-foreground">{uiText.emptyFilterTitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {uiText.emptyFilterHint}
            </p>
            <button
              type="button"
              onClick={() => setActiveDifficulty('all')}
              className="mt-6 inline-flex h-10 cursor-pointer items-center rounded-full border border-border/70 bg-muted/60 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {uiText.clearFilter}
            </button>
          </div>
        ) : (
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {filteredRecipes.map((recipe) => {
              const normalizedDifficulty = normalizeDifficulty(recipe.difficulty);

              return (
                <RecipeListCard
                  key={recipe.id}
                  recipe={recipe}
                  href={withLocalePath(locale, `/recipe/${recipe.id}`)}
                  minsLabel={tRecipe('mins')}
                  difficultyLabel={recipe.difficulty ? tRecipe(normalizedDifficulty) : undefined}
                  layout="overlay"
                  mediaClassName={getMasonryMediaClass(recipe.id)}
                  className="mb-6 break-inside-avoid"
                  topLeftContent={
                    <>
                      {recipe.cuisine?.name && (
                        <span className="inline-flex items-center rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
                          {recipe.cuisine.name}
                        </span>
                      )}
                    </>
                  }
                />
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 border-t border-border/70 pt-6 text-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoading}
              className="h-10 px-5"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('loadingRecipes')}
                </>
              ) : (
                t('loadMore')
              )}
            </Button>
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
