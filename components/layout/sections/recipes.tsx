"use client";

import { useTranslations, useLocale } from 'next-intl';
import { SectionHeader } from '@/components/layout/section-header';
import { RecipeListCard } from '@/components/recipe/recipe-list-card';
import type { HomeRecipePreview } from '@/lib/home-types';
import { withLocalePath } from '@/lib/utils/locale-path';
import { getMealTypeLabel } from '@/lib/meal-type';
import { normalizeRecipeVibe } from '@/lib/vibe';

const masonryMediaClasses = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-[5/6]', 'aspect-square', 'aspect-[10/13]'] as const;

function getMasonryMediaClass(seed: string | number): string {
  const source = String(seed);
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return masonryMediaClasses[hash % masonryMediaClasses.length];
}

interface RecipesSectionProps {
  recipes: HomeRecipePreview[];
}

export const RecipesSection = ({ recipes }: RecipesSectionProps) => {
  const t = useTranslations('recipes');
  const tRecipe = useTranslations('recipeDisplay');
  const locale = useLocale();

  const hasRecipes = recipes.length > 0;

  return (
    <section id="recipes" className="home-section">
      <div className="px-4 md:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <SectionHeader
            eyebrow={t('title')}
            title={t('subtitle')}
            description={t('description1')}
            className="home-section-header"
          />

          {hasRecipes ? (
            <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
              {recipes.map((recipe) => {
                const normalizedVibe = normalizeRecipeVibe(recipe.vibe, 'comfort');
                const topBadgeLabel =
                  (recipe.mealType ? getMealTypeLabel(recipe.mealType, locale) : undefined) ||
                  recipe.cuisine?.name;
                return (
                  <RecipeListCard
                    key={recipe.id}
                    recipe={recipe}
                    href={withLocalePath(locale, `/recipe/${recipe.id}`)}
                    minsLabel={tRecipe('mins')}
                    vibeLabel={recipe.vibe ? tRecipe(normalizedVibe) : undefined}
                    layout="overlay"
                    mediaClassName={getMasonryMediaClass(recipe.id)}
                    className="mb-6 break-inside-avoid"
                    topLeftContent={
                      topBadgeLabel ? (
                        <span className="inline-flex items-center rounded-full bg-background-80 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
                          {topBadgeLabel}
                        </span>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-2xl border border-border-70 bg-card p-8 text-center sm:p-10">
              <p className="text-xl font-semibold tracking-tight text-foreground">{t('loadingRecipes')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
