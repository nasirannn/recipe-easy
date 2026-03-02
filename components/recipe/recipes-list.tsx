"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Bookmark } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  RecipeListCard,
  RecipeListCardSkeleton,
} from "@/components/recipe/recipe-list-card";
import type { HomeRecipePreview } from "@/lib/home-types";
import { withLocalePath } from "@/lib/utils/locale-path";
import { buildAuthPath } from "@/lib/utils/auth-path";
import { useAuth } from "@/contexts/auth-context";
import { getMealTypeLabel, normalizeMealType } from "@/lib/meal-type";
import { normalizeRecipeVibe } from "@/lib/vibe";
import { overlayIconButtonClass } from "@/lib/utils/button-styles";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("recipes");
  const tRecipe = useTranslations("recipeDisplay");
  const isZh = locale.toLowerCase().startsWith("zh");
  const { user, session } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState<RecipeWithMeta[]>(
    () => initialRecipes.filter((recipe) => Boolean(recipe.imagePath))
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<Set<string>>(new Set());
  const authPath = useMemo(() => {
    const query = searchParams.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    return buildAuthPath(locale, nextPath);
  }, [locale, pathname, searchParams]);

  const uiText = isZh
    ? {
        eyebrow: "探索",
        heroTitle: "精选菜谱画廊",
        heroLead: "浏览由 Recipe Easy 精选的图文菜谱，点击任意封面即可查看完整做法。",
        heroNoteHighlight: "登录可领取每日免费积分",
        heroNoteSuffix: "持续解锁更多优质菜谱内容。",
        emptyStateTitle: "暂时还没有可展示的菜谱",
        emptyStateHint: "请稍后再来看看，我们会持续更新带图片的菜谱。",
        addFavoriteLabel: "收藏菜谱",
        removeFavoriteLabel: "取消收藏",
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
        addFavoriteLabel: "Save recipe",
        removeFavoriteLabel: "Remove favorite",
      };

  useEffect(() => {
    setRecipes(initialRecipes.filter((recipe) => Boolean(recipe.imagePath)));
    setHasMore(initialHasMore);
    setPage(1);
    setIsLoading(false);
  }, [initialRecipes, initialHasMore]);

  useEffect(() => {
    if (user?.id && session?.access_token) {
      const controller = new AbortController();
      const loadFavorites = async () => {
        try {
          const response = await fetch(
            `/api/recipes/favorites?userId=${encodeURIComponent(user.id)}`,
            {
              signal: controller.signal,
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              router.replace(authPath);
              return;
            }
            throw new Error('Failed to load favorite recipes');
          }
          const result = await response.json() as {
            success?: boolean;
            favoriteRecipeIds?: string[];
          };

          if (!result.success) {
            throw new Error('Failed to load favorite recipes');
          }

          const ids = Array.isArray(result.favoriteRecipeIds)
            ? result.favoriteRecipeIds.map((item) => String(item)).filter(Boolean)
            : [];
          setFavoriteRecipeIds(new Set(ids));
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            return;
          }
          setFavoriteRecipeIds(new Set());
        }
      };

      loadFavorites();
      return () => controller.abort();
    }

    setFavoriteRecipeIds(new Set());
  }, [authPath, router, session?.access_token, user?.id]);

  const toggleFavorite = useCallback(
    async (recipeId: string) => {
      if (!user?.id || !session?.access_token) {
        router.push(authPath);
        return;
      }

      const currentFavorite = favoriteRecipeIds.has(recipeId);
      const nextFavorite = !currentFavorite;

      setFavoriteRecipeIds((prev) => {
        const next = new Set(prev);
        if (nextFavorite) {
          next.add(recipeId);
        } else {
          next.delete(recipeId);
        }
        return next;
      });

      try {
        const response = await fetch('/api/recipes/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            recipeId,
            favorite: nextFavorite,
          }),
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            router.push(authPath);
            return;
          }
          throw new Error('Failed to update favorite recipe');
        }

        const result = await response.json() as {
          success?: boolean;
          favorite?: boolean;
        };
        if (!result.success) {
          throw new Error('Failed to update favorite recipe');
        }

        setFavoriteRecipeIds((prev) => {
          const next = new Set(prev);
          if (result.favorite) {
            next.add(recipeId);
          } else {
            next.delete(recipeId);
          }
          return next;
        });
      } catch {
        setFavoriteRecipeIds((prev) => {
          const next = new Set(prev);
          if (currentFavorite) {
            next.add(recipeId);
          } else {
            next.delete(recipeId);
          }
          return next;
        });
      }
    },
    [authPath, favoriteRecipeIds, router, session?.access_token, user?.id]
  );

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
                const isFavorite = favoriteRecipeIds.has(recipe.id);
                const normalizedVibe = normalizeRecipeVibe(recipe.vibe, "comfort");
                const topBadgeLabel =
                  (recipe.mealType ? getMealTypeLabel(recipe.mealType, locale) : undefined) ||
                  recipe.cuisine?.name;
                return (
                  <RecipeListCard
                    key={recipe.id}
                    recipe={recipe}
                    href={withLocalePath(locale, `/recipe/${recipe.id}`)}
                    minsLabel={tRecipe("mins")}
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
                    topRightContent={
                      <button
                        type="button"
                        aria-pressed={isFavorite}
                        aria-label={isFavorite ? uiText.removeFavoriteLabel : uiText.addFavoriteLabel}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleFavorite(recipe.id);
                        }}
                        className={overlayIconButtonClass({
                          active: isFavorite,
                          className: "h-8 w-8",
                        })}
                      >
                        <Bookmark className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                      </button>
                    }
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
