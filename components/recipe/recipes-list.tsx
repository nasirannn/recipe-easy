"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  RecipeListCardSkeleton,
} from "@/components/recipe/recipe-list-card";
import { ExploreRecipeCard } from "@/components/recipe/explore-recipe-card";
import type { HomeRecipePreview } from "@/lib/home-types";
import { withLocalePath } from "@/lib/utils/locale-path";
import { getMealTypeLabel, normalizeMealType } from "@/lib/meal-type";
import { normalizeRecipeVibe } from "@/lib/vibe";

interface RecipesListProps {
  locale: string;
  initialRecipes?: HomeRecipePreview[];
  initialHasMore?: boolean;
}

type RecipeWithMeta = HomeRecipePreview;

const PAGE_SIZE = 20;
const masonryMediaClasses = ["aspect-[4/5]", "aspect-[3/4]", "aspect-[5/6]", "aspect-square", "aspect-[10/13]"] as const;

function getMasonryMediaClass(seed: string | number): string {
  const source = String(seed);
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return masonryMediaClasses[hash % masonryMediaClasses.length];
}

export const RecipesList = ({
  locale,
  initialRecipes = [],
  initialHasMore = false,
}: RecipesListProps) => {
  const t = useTranslations("recipes");
  const tRecipe = useTranslations("recipeDisplay");
  const isZh = locale.toLowerCase().startsWith("zh");

  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState<RecipeWithMeta[]>(
    () => initialRecipes.filter((recipe) => Boolean(recipe.imagePath))
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const uiText = isZh
    ? {
        eyebrow: "探索",
        heroTitle: "精选菜谱画廊",
        heroLead: "浏览由 Recipe Easy 精选的图文菜谱，点击任意封面即可查看完整做法。",
        heroNoteHighlight: "登录可领取每日免费积分",
        heroNoteSuffix: "持续解锁更多优质菜谱内容。",
        emptyStateTitle: "暂时还没有可展示的菜谱",
        emptyStateHint: "请稍后再来看看，我们会持续更新带图片的菜谱。",
      }
    : {
        eyebrow: "Explore",
        heroTitle: "Featured Recipe Gallery",
        heroLead:
          "Explore Recipe Easy's curated collection of image-first recipes. Open any cover to view the complete recipe.",
        heroNoteHighlight: "Sign in to claim free daily credits",
        heroNoteSuffix: "and unlock more complete recipe content.",
        emptyStateTitle: "No recipes are available right now",
        emptyStateHint: "Please check back soon. New recipes with images are added continuously.",
      };

  useEffect(() => {
    setRecipes(initialRecipes.filter((recipe) => Boolean(recipe.imagePath)));
    setHasMore(initialHasMore);
    setPage(1);
    setIsLoading(false);
  }, [initialRecipes, initialHasMore]);

  useEffect(() => {
    if (page <= 1) {
      return;
    }

    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/recipes?type=all&page=${page}&limit=${PAGE_SIZE}&lang=${locale}&withImage=true`
        );
        const data = (await response.json()) as any;

        if (data.success) {
          const rawResults = Array.isArray(data.results) ? data.results : [];
          const transformedRecipes: RecipeWithMeta[] = rawResults
            .map((recipe: any) => ({
            id: recipe.id,
            title: recipe.title,
            imagePath: recipe.imagePath,
            description: recipe.description,
            tags: recipe.tags || [],
            cookingTime: recipe.cookingTime || 30,
            servings: recipe.servings || 4,
            vibe: normalizeRecipeVibe(recipe.vibe, "comfort"),
            mealType: normalizeMealType(recipe.mealType ?? recipe.meal_type, null),
            userId: recipe.userId || recipe.user_id || undefined,
            authorName: recipe.authorName || recipe.author_name || undefined,
            authorAvatarUrl: recipe.authorAvatarUrl || recipe.author_avatar_url || undefined,
            cuisine: recipe.cuisine
              ? {
                  id: recipe.cuisine.id,
                  name: recipe.cuisine.name,
                }
              : undefined,
            createdAt: recipe.createdAt || recipe.created_at,
            }))
            .filter((recipe: RecipeWithMeta) => Boolean(recipe.imagePath));

          setRecipes((prev) => [...prev, ...transformedRecipes]);

          setHasMore(rawResults.length === PAGE_SIZE);
        }
      } catch {
        // Keep UI stable on fetch errors.
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [locale, page]);

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  const renderHeader = () => (
    <header className="mb-8 text-center sm:mb-10">
      <div className="mx-auto max-w-4xl space-y-3 sm:space-y-4">
        <span className="home-eyebrow">{uiText.eyebrow}</span>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {uiText.heroTitle}
        </h1>
        <p className="mx-auto max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {uiText.heroLead}
        </p>
        <p className="mx-auto max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          <span className="text-muted-foreground">
            {uiText.heroNoteHighlight}
          </span>
          {" "}
          <span className="text-muted-foreground">
            {uiText.heroNoteSuffix}
          </span>
        </p>
      </div>
    </header>
  );

  if (isLoading && page === 1) {
    return (
      <div className="bg-background text-foreground">
        <div className="px-4 py-8 md:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-[1200px]">
            {renderHeader()}
            <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <RecipeListCardSkeleton
                  key={`recipes-library-skeleton-${index}`}
                  layout="overlay"
                  mediaClassName={getMasonryMediaClass(index)}
                  className="mb-6 break-inside-avoid"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="px-4 py-8 md:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1200px]">
          {renderHeader()}

          {recipes.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center sm:p-10">
              <p className="text-xl font-semibold tracking-tight text-foreground">{uiText.emptyStateTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {uiText.emptyStateHint}
              </p>
            </div>
          ) : (
            <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
              {recipes.map((recipe) => {
                const normalizedVibe = normalizeRecipeVibe(recipe.vibe, "comfort");
                const topBadgeLabel =
                  (recipe.mealType ? getMealTypeLabel(recipe.mealType, locale) : undefined) ||
                  recipe.cuisine?.name;
                return (
                  <ExploreRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    href={withLocalePath(locale, `/recipe/${recipe.id}`)}
                    minsLabel={tRecipe("mins")}
                    vibeLabel={recipe.vibe ? tRecipe(normalizedVibe) : undefined}
                    metaRightLabel={topBadgeLabel}
                    vibeBadgeClassName="text-white/90"
                    mediaClassName={getMasonryMediaClass(recipe.id)}
                    className="mb-6 break-inside-avoid"
                  />
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="mt-10 border-t border-border pt-6 text-center">
              <Button variant="outline" onClick={loadMore} disabled={isLoading} className="h-10 px-5">
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {t("loadingRecipes")}
                  </>
                ) : (
                  t("loadMore")
                )}
              </Button>
            </div>
          )}

          {!hasMore && recipes.length > 0 && (
            <div className="mt-10 pt-6 text-center">
              <p className="text-sm text-muted-foreground">{t("allRecipesDisplayed")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
