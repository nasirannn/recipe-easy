"use client";

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { SectionHeader } from '@/components/layout/section-header';
import { RecipeListCard, RecipeListCardSkeleton } from '@/components/recipe/recipe-list-card';
import { Recipe } from '@/lib/types';

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

export const RecipesSection = () => {
  const t = useTranslations('recipes');
  const tRecipe = useTranslations('recipeDisplay');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/recipes?page=1&limit=9&lang=${locale}&withImage=1`);
        const data = await response.json() as { success?: boolean; results?: Recipe[] };

        if (data.success) {
          setRecipes((data.results ?? []).slice(0, 9));
        } else {
          setRecipes([]);
        }
      } catch {
        setRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [locale]);

  const hasRecipes = recipes.length > 0;

  return (
    <section id="recipes" className="home-section">
      <div className="home-inner">
        <SectionHeader
          eyebrow={t('title')}
          title={t('subtitle')}
          description={t('description1')}
          className="mb-8 md:mb-10"
        />

        {isLoading ? (
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <RecipeListCardSkeleton
                key={`featured-recipe-skeleton-${index}`}
                layout="overlay"
                mediaClassName={getMasonryMediaClass(index)}
                className="mb-6 break-inside-avoid"
              />
            ))}
          </div>
        ) : hasRecipes ? (
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {recipes.map((recipe) => {
              const normalizedDifficulty = normalizeDifficulty(recipe.difficulty);
              return (
                <RecipeListCard
                  key={recipe.id}
                  recipe={recipe}
                  href={`/${locale}/recipe/${recipe.id}`}
                  minsLabel={tRecipe('mins')}
                  difficultyLabel={recipe.difficulty ? tRecipe(normalizedDifficulty) : undefined}
                  layout="overlay"
                  mediaClassName={getMasonryMediaClass(recipe.id)}
                  className="mb-6 break-inside-avoid"
                  topLeftContent={
                    recipe.cuisine?.name ? (
                      <span className="inline-flex items-center rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
                        {recipe.cuisine.name}
                      </span>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border border-border/70 bg-card p-8 text-center sm:p-10">
            <p className="text-xl font-semibold tracking-tight text-foreground">{t('loadingRecipes')}</p>
          </div>
        )}
      </div>
    </section>
  );
};
