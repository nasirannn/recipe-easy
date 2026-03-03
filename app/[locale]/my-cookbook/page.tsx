"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Bookmark, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FooterSection } from "@/components/layout/sections/footer";
import {
  RecipeCookbookCard,
  RecipeCookbookCardSkeleton,
} from "@/components/recipe/recipe-cookbook-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HomeRecipePreview } from "@/lib/home-types";
import { withLocalePath } from "@/lib/utils/locale-path";
import { buildAuthPath } from "@/lib/utils/auth-path";
import { getMealTypeLabel, MEAL_TYPE_OPTIONS, normalizeMealType, type MealType } from "@/lib/meal-type";
import { normalizeRecipeVibe, RECIPE_VIBES, type RecipeVibe } from "@/lib/vibe";
import { optionButtonClass, overlayIconButtonClass } from "@/lib/utils/button-styles";

type MealTypeFilter = "all" | MealType;
type VibeFilter = "all" | RecipeVibe;
type CollectionFilter = "recipes" | "favorites";
type SortOption = "newest" | "timeAsc" | "titleAsc";

type CookbookRecipe = HomeRecipePreview & {
  isCreated: boolean;
  isFavorite: boolean;
};

const FETCH_LIMIT = 120;
const COOKBOOK_CACHE_TTL_MS = 60 * 1000;

type CookbookCacheSnapshot = {
  createdRecipes: HomeRecipePreview[];
  favoriteRecipes: HomeRecipePreview[];
  cachedAt: number;
};

const cookbookCache = new Map<string, CookbookCacheSnapshot>();

function toRecipePreview(recipe: any): HomeRecipePreview {
  return {
    id: recipe.id,
    title: recipe.title,
    imagePath: recipe.imagePath,
    description: recipe.description,
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
  };
}

export default function MyRecipesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, session, loading: authLoading } = useAuth();
  const locale = useLocale();
  const t = useTranslations("myRecipes");
  const tRecipe = useTranslations("recipeDisplay");
  const homeHref = withLocalePath(locale);
  const isZh = locale.toLowerCase().startsWith("zh");
  const cacheKey = user?.id ? `${user.id}:${locale}` : null;
  const initialCacheSnapshot = cacheKey ? cookbookCache.get(cacheKey) : undefined;
  const authPath = useMemo(() => {
    const query = searchParams.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    return buildAuthPath(locale, nextPath);
  }, [locale, pathname, searchParams]);

  const [createdRecipes, setCreatedRecipes] = useState<HomeRecipePreview[]>(
    () => initialCacheSnapshot?.createdRecipes ?? []
  );
  const [favoriteRecipes, setFavoriteRecipes] = useState<HomeRecipePreview[]>(
    () => initialCacheSnapshot?.favoriteRecipes ?? []
  );
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<Set<string>>(
    () => new Set((initialCacheSnapshot?.favoriteRecipes ?? []).map((recipe) => recipe.id))
  );
  const [hasHydratedCookbook, setHasHydratedCookbook] = useState<boolean>(
    () => Boolean(initialCacheSnapshot)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<CookbookRecipe | null>(null);

  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("recipes");
  const [activeMealType, setActiveMealType] = useState<MealTypeFilter>("all");
  const [activeVibe, setActiveVibe] = useState<VibeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const copy = isZh
    ? {
        subtitle: "管理你创建和收藏的菜谱，一页完成整理与回看。",
        recipesLabel: "菜谱",
        favoritesLabel: "收藏",
        mealTypeLabel: "类型",
        mealTypeAll: "全部类型",
        vibeLabel: "风格",
        vibeAll: "全部风格",
        searchPlaceholder: "搜索菜谱名称、描述或菜系...",
        sortLabel: "排序",
        sortNewest: "最新创建",
        sortTime: "烹饪时间短",
        sortTitle: "标题 A-Z",
        viewRecipe: "查看菜谱",
        clearFilter: "清空筛选",
        emptyFilterTitle: "没有匹配当前条件的菜谱",
        emptyFilterHint: "可以清空筛选或修改关键词后再试。",
        removeFavoriteLabel: "取消收藏",
        addFavoriteLabel: "收藏菜谱",
      }
    : {
        subtitle: "Manage the recipes you created and saved in one unified cookbook.",
        recipesLabel: "Recipes",
        favoritesLabel: "Favorites",
        mealTypeLabel: "Type",
        mealTypeAll: "Any type",
        vibeLabel: "Vibe",
        vibeAll: "Any vibe",
        searchPlaceholder: "Search by title, description, or cuisine...",
        sortLabel: "Sort",
        sortNewest: "Newest first",
        sortTime: "Shortest cooking time",
        sortTitle: "Title A-Z",
        viewRecipe: "View Recipe",
        clearFilter: "Clear filters",
        emptyFilterTitle: "No recipes match your current filters",
        emptyFilterHint: "Try adjusting filters or search terms to see more results.",
        removeFavoriteLabel: "Remove favorite",
        addFavoriteLabel: "Save recipe",
      };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(authPath);
    }
  }, [authLoading, authPath, user, router]);

  const loadCookbook = useCallback(async () => {
    if (!user?.id || !cacheKey) return;

    const cachedSnapshot = cookbookCache.get(cacheKey);
    const cacheIsFresh =
      typeof cachedSnapshot?.cachedAt === "number" &&
      Date.now() - cachedSnapshot.cachedAt <= COOKBOOK_CACHE_TTL_MS;

    if (cachedSnapshot) {
      setCreatedRecipes(cachedSnapshot.createdRecipes);
      setFavoriteRecipes(cachedSnapshot.favoriteRecipes);
      setFavoriteRecipeIds(new Set(cachedSnapshot.favoriteRecipes.map((recipe) => recipe.id)));
      setHasHydratedCookbook(true);
    }

    if (cachedSnapshot && cacheIsFresh) {
      return;
    }

    const shouldShowLoading = !cachedSnapshot;

    try {
      if (shouldShowLoading) {
        setIsLoading(true);
      }
      const [createdResponse, favoritesResponse] = await Promise.all([
        fetch(`/api/recipes/user/${user.id}?page=1&limit=${FETCH_LIMIT}&lang=${locale}`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        }),
        fetch(
          `/api/recipes?page=1&limit=${FETCH_LIMIT}&lang=${locale}&favoriteUserId=${encodeURIComponent(
            user.id
          )}`,
          {
            headers: session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : undefined,
          }
        ),
      ]);

      if (!createdResponse.ok || !favoritesResponse.ok) {
        if (
          createdResponse.status === 401 ||
          createdResponse.status === 403 ||
          favoritesResponse.status === 401 ||
          favoritesResponse.status === 403
        ) {
          router.replace(authPath);
          return;
        }
        throw new Error("Failed to load cookbook recipes");
      }

      const createdData = (await createdResponse.json()) as any;
      const favoritesData = (await favoritesResponse.json()) as any;
      if (!createdData.success || !favoritesData.success) {
        throw new Error("Failed to load cookbook recipes");
      }

      const nextCreated = Array.isArray(createdData.recipes)
        ? createdData.recipes.map(toRecipePreview)
        : [];
      const nextFavorites = Array.isArray(favoritesData.results)
        ? favoritesData.results.map(toRecipePreview)
        : [];

      cookbookCache.set(cacheKey, {
        createdRecipes: nextCreated,
        favoriteRecipes: nextFavorites,
        cachedAt: Date.now(),
      });
      setCreatedRecipes(nextCreated);
      setFavoriteRecipes(nextFavorites);
      setFavoriteRecipeIds(new Set(nextFavorites.map((recipe) => recipe.id)));
      setHasHydratedCookbook(true);
    } catch {
      if (!cachedSnapshot) {
        toast.error(t("loadError"));
        setCreatedRecipes([]);
        setFavoriteRecipes([]);
        setFavoriteRecipeIds(new Set());
        setHasHydratedCookbook(true);
      }
    } finally {
      if (shouldShowLoading) {
        setIsLoading(false);
      }
    }
  }, [authPath, cacheKey, locale, router, session?.access_token, t, user?.id]);

  useEffect(() => {
    if (!cacheKey) {
      setCreatedRecipes([]);
      setFavoriteRecipes([]);
      setFavoriteRecipeIds(new Set());
      setHasHydratedCookbook(false);
      return;
    }

    const cachedSnapshot = cookbookCache.get(cacheKey);
    if (!cachedSnapshot) {
      setCreatedRecipes([]);
      setFavoriteRecipes([]);
      setFavoriteRecipeIds(new Set());
      setHasHydratedCookbook(false);
      return;
    }

    setCreatedRecipes(cachedSnapshot.createdRecipes);
    setFavoriteRecipes(cachedSnapshot.favoriteRecipes);
    setFavoriteRecipeIds(new Set(cachedSnapshot.favoriteRecipes.map((recipe) => recipe.id)));
    setHasHydratedCookbook(true);
  }, [cacheKey]);

  useEffect(() => {
    if (user?.id) {
      loadCookbook();
    }
  }, [loadCookbook, user?.id]);

  useEffect(() => {
    if (!cacheKey || !hasHydratedCookbook) {
      return;
    }

    cookbookCache.set(cacheKey, {
      createdRecipes,
      favoriteRecipes,
      cachedAt: Date.now(),
    });
  }, [cacheKey, createdRecipes, favoriteRecipes, hasHydratedCookbook]);

  const allRecipes = useMemo(() => {
    const byId = new Map<string, CookbookRecipe>();

    createdRecipes.forEach((recipe) => {
      byId.set(recipe.id, {
        ...recipe,
        isCreated: true,
        isFavorite: favoriteRecipeIds.has(recipe.id),
      });
    });

    favoriteRecipes.forEach((recipe) => {
      const existing = byId.get(recipe.id);
      if (existing) {
        byId.set(recipe.id, {
          ...existing,
          isFavorite: true,
        });
        return;
      }

      byId.set(recipe.id, {
        ...recipe,
        isCreated: recipe.userId === user?.id,
        isFavorite: true,
      });
    });

    return Array.from(byId.values());
  }, [createdRecipes, favoriteRecipes, favoriteRecipeIds, user?.id]);

  const mealTypeFilters: Array<{ key: MealTypeFilter; label: string }> = [
    { key: "all", label: copy.mealTypeAll },
    ...MEAL_TYPE_OPTIONS.map((mealType) => ({
      key: mealType,
      label: getMealTypeLabel(mealType, locale),
    })),
  ];

  const vibeFilters: Array<{ key: VibeFilter; label: string }> = [
    { key: "all", label: copy.vibeAll },
    ...RECIPE_VIBES.map((vibe) => ({
      key: vibe,
      label: tRecipe(vibe),
    })),
  ];

  const filteredRecipes = useMemo(() => {
    const byCollection = allRecipes.filter((recipe) => {
      if (collectionFilter === "favorites") return recipe.isFavorite;
      return collectionFilter === "recipes";
    });

    const byMealType =
      activeMealType === "all"
        ? byCollection
        : byCollection.filter((recipe) => normalizeMealType(recipe.mealType, null) === activeMealType);

    const byVibe =
      activeVibe === "all"
        ? byMealType
        : byMealType.filter((recipe) => normalizeRecipeVibe(recipe.vibe, "comfort") === activeVibe);

    const query = searchQuery.trim().toLowerCase();
    const bySearch = query
      ? byVibe.filter((recipe) => {
          const mealTypeLabel = recipe.mealType ? getMealTypeLabel(recipe.mealType, locale) : "";
          const vibeLabel = tRecipe(normalizeRecipeVibe(recipe.vibe, "comfort"));
          const haystack =
            `${recipe.title} ${recipe.description || ""} ${recipe.cuisine?.name || ""} ${mealTypeLabel} ${vibeLabel}`.toLowerCase();
          return haystack.includes(query);
        })
      : byVibe;

    return [...bySearch].sort((a, b) => {
      if (sortBy === "titleAsc") {
        return a.title.localeCompare(b.title, isZh ? "zh" : "en");
      }

      if (sortBy === "timeAsc") {
        const timeA = Number(a.cookingTime || 0);
        const timeB = Number(b.cookingTime || 0);
        return timeA - timeB;
      }

      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [activeMealType, activeVibe, allRecipes, collectionFilter, isZh, locale, searchQuery, sortBy, tRecipe]);

  const openDeleteDialog = (recipe: CookbookRecipe) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRecipeToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!recipeToDelete || !user?.id) return;

    try {
      setDeleting(recipeToDelete.id);
      const response = await fetch(`/api/recipes/${recipeToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe");
      }

      setCreatedRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeToDelete.id));
      setFavoriteRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeToDelete.id));
      setFavoriteRecipeIds((prev) => {
        const next = new Set(prev);
        next.delete(recipeToDelete.id);
        return next;
      });

      toast.success(t("deleteSuccess"));
      closeDeleteDialog();
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setDeleting(null);
    }
  };

  const applyFavoriteState = useCallback((recipe: HomeRecipePreview, favorite: boolean) => {
    setFavoriteRecipeIds((prev) => {
      const next = new Set(prev);
      if (favorite) {
        next.add(recipe.id);
      } else {
        next.delete(recipe.id);
      }
      return next;
    });

    setFavoriteRecipes((prev) => {
      const exists = prev.some((item) => item.id === recipe.id);
      if (favorite) {
        if (exists) {
          return prev;
        }
        return [recipe, ...prev];
      }
      return prev.filter((item) => item.id !== recipe.id);
    });
  }, []);

  const handleToggleFavorite = useCallback(
    async (recipe: CookbookRecipe) => {
      if (!user?.id || !session?.access_token) {
        router.push(authPath);
        return;
      }

      const currentFavorite = favoriteRecipeIds.has(recipe.id);
      const nextFavorite = !currentFavorite;

      applyFavoriteState(recipe, nextFavorite);

      try {
        const response = await fetch("/api/recipes/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            recipeId: recipe.id,
            favorite: nextFavorite,
          }),
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            router.push(authPath);
            return;
          }
          throw new Error("Failed to update favorite recipe");
        }

        const result = (await response.json()) as {
          success?: boolean;
          favorite?: boolean;
        };

        if (!result.success || typeof result.favorite !== "boolean") {
          throw new Error("Failed to update favorite recipe");
        }

        applyFavoriteState(recipe, result.favorite);
      } catch {
        applyFavoriteState(recipe, currentFavorite);
      }
    },
    [applyFavoriteState, authPath, favoriteRecipeIds, router, session?.access_token, user?.id]
  );

  const renderHeader = (disabled = false) => (
    <header className="mb-8 space-y-5 sm:mb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {copy.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={disabled}
            aria-pressed={collectionFilter === "recipes"}
            onClick={disabled ? undefined : () => setCollectionFilter("recipes")}
            className={optionButtonClass({
              active: collectionFilter === "recipes",
              disabled,
              className: "min-w-[110px] rounded-lg px-4 py-2 text-center",
            })}
          >
            <p
              className={`text-2xl font-black tracking-tight ${
                collectionFilter === "recipes" ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {allRecipes.length}
            </p>
            <p
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                collectionFilter === "recipes" ? "text-primary-foreground/85" : "text-muted-foreground"
              }`}
            >
              {copy.recipesLabel}
            </p>
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-pressed={collectionFilter === "favorites"}
            onClick={disabled ? undefined : () => setCollectionFilter("favorites")}
            className={optionButtonClass({
              active: collectionFilter === "favorites",
              disabled,
              className: "min-w-[110px] rounded-lg px-4 py-2 text-center",
            })}
          >
            <p
              className={`text-2xl font-black tracking-tight ${
                collectionFilter === "favorites" ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {favoriteRecipeIds.size}
            </p>
            <p
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                collectionFilter === "favorites" ? "text-primary-foreground/85" : "text-muted-foreground"
              }`}
            >
              {copy.favoritesLabel}
            </p>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-[460px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="block h-11 w-full rounded-xl border border-border bg-card pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
          <div className="w-full sm:w-[180px]">
            <Select
              value={activeMealType}
              disabled={disabled}
              onValueChange={(value) => setActiveMealType(value as MealTypeFilter)}
            >
              <SelectTrigger
                aria-label={copy.mealTypeLabel}
                className="h-11 w-full rounded-xl border-border/70 bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-[border-color,box-shadow] hover:border-primary/40 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 data-[state=open]:border-primary/55"
              >
                <SelectValue placeholder={copy.mealTypeLabel} className="truncate" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70 bg-card p-1 shadow-lg">
                {mealTypeFilters.map((filter) => (
                  <SelectItem
                    key={filter.key}
                    value={filter.key}
                    className="cursor-pointer rounded-lg py-2 text-sm font-medium focus:bg-primary/10"
                  >
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[150px]">
            <Select
              value={activeVibe}
              disabled={disabled}
              onValueChange={(value) => setActiveVibe(value as VibeFilter)}
            >
              <SelectTrigger
                aria-label={copy.vibeLabel}
                className="h-11 w-full rounded-xl border-border/70 bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-[border-color,box-shadow] hover:border-primary/40 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 data-[state=open]:border-primary/55"
              >
                <SelectValue placeholder={copy.vibeLabel} className="truncate" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70 bg-card p-1 shadow-lg">
                {vibeFilters.map((filter) => (
                  <SelectItem
                    key={filter.key}
                    value={filter.key}
                    className="cursor-pointer rounded-lg py-2 text-sm font-medium focus:bg-primary/10"
                  >
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[210px]">
            <Select value={sortBy} disabled={disabled} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger
                aria-label={copy.sortLabel}
                className="h-11 w-full rounded-xl border-border/70 bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-[border-color,box-shadow] hover:border-primary/40 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 data-[state=open]:border-primary/55"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
                    <SlidersHorizontal className="h-4 w-4" />
                  </span>
                  <SelectValue placeholder={copy.sortLabel} className="truncate" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70 bg-card p-1 shadow-lg">
                <SelectItem
                  value="newest"
                  className="cursor-pointer rounded-lg py-2 text-sm font-medium focus:bg-primary/10"
                >
                  {copy.sortNewest}
                </SelectItem>
                <SelectItem
                  value="timeAsc"
                  className="cursor-pointer rounded-lg py-2 text-sm font-medium focus:bg-primary/10"
                >
                  {copy.sortTime}
                </SelectItem>
                <SelectItem
                  value="titleAsc"
                  className="cursor-pointer rounded-lg py-2 text-sm font-medium focus:bg-primary/10"
                >
                  {copy.sortTitle}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  );

  const renderPageShell = (children: ReactNode, showFooter = false) => (
    <div className="bg-background text-foreground">
      <div className="px-4 py-8 md:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </div>
      {showFooter && <FooterSection />}
    </div>
  );

  const renderRecipeGridSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <RecipeCookbookCardSkeleton key={`my-cookbook-skeleton-${index}`} />
      ))}
    </div>
  );

  if (authLoading || ((isLoading || !hasHydratedCookbook) && allRecipes.length === 0)) {
    return renderPageShell(
      <>
        {renderHeader(true)}
        <div className="space-y-8">
          {renderRecipeGridSkeleton()}
          <div className="flex justify-center">
            <Skeleton className="h-10 w-56 rounded-full" />
          </div>
        </div>
      </>
    );
  }

  if (!authLoading && !user) {
    return renderPageShell(
      <div className="space-y-8">
        {renderRecipeGridSkeleton()}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-56 rounded-full" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return renderPageShell(
      <>
        {renderHeader(true)}
        <div className="space-y-8">
          {renderRecipeGridSkeleton()}
          <div className="flex justify-center">
            <Skeleton className="h-10 w-56 rounded-full" />
          </div>
        </div>
      </>,
      true
    );
  }

  return renderPageShell(
    <>
      {renderHeader()}

      {allRecipes.length === 0 ? (
        <div className="mx-auto max-w-2xl py-2 text-center sm:py-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("emptyState.title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("emptyState.description")}
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="h-11 bg-linear-to-r from-primary to-[--color-primary-90] px-6"
            >
              <Link href={homeHref}>{t("emptyState.action")}</Link>
            </Button>
          </div>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="mx-auto max-w-2xl py-2 text-center sm:py-4">
          <p className="text-xl font-semibold tracking-tight text-foreground">{copy.emptyFilterTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {copy.emptyFilterHint}
          </p>
          <button
            type="button"
            onClick={() => {
              setCollectionFilter("recipes");
              setActiveMealType("all");
              setActiveVibe("all");
              setSearchQuery("");
            }}
            className="mt-6 inline-flex h-11 cursor-pointer items-center rounded-full border border-border bg-muted px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2"
          >
            {copy.clearFilter}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredRecipes.map((recipe) => {
            const normalizedVibe = normalizeRecipeVibe(recipe.vibe, "comfort");
            const isFavorite = favoriteRecipeIds.has(recipe.id);
            const accentLabel =
              (recipe.mealType ? getMealTypeLabel(recipe.mealType, locale) : undefined) ||
              recipe.cuisine?.name ||
              tRecipe(normalizedVibe);

            return (
              <RecipeCookbookCard
                key={recipe.id}
                recipe={recipe}
                href={withLocalePath(locale, `/recipe/${recipe.id}?source=my-cookbook`)}
                minsLabel={tRecipe("mins")}
                vibeLabel={recipe.vibe ? tRecipe(normalizedVibe) : undefined}
                accentLabel={accentLabel}
                footerActionLabel={copy.viewRecipe}
                topRightAction={
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={isFavorite}
                      aria-label={isFavorite ? copy.removeFavoriteLabel : copy.addFavoriteLabel}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleToggleFavorite(recipe);
                      }}
                      className={overlayIconButtonClass({
                        active: isFavorite,
                        className: "h-8 w-8",
                      })}
                    >
                      <Bookmark className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                    </button>

                    {recipe.isCreated ? (
                      <button
                        type="button"
                        aria-label={t("delete")}
                        disabled={deleting === recipe.id}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openDeleteDialog(recipe);
                        }}
                        className={overlayIconButtonClass({
                          destructive: true,
                          disabled: deleting === recipe.id,
                          className: "h-8 w-8 shadow-md",
                        })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive-foreground" />
                      </button>
                    ) : null}
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {allRecipes.length > 0 && filteredRecipes.length > 0 ? (
        <div className="mt-10 pt-6 text-center">
          <p className="text-sm text-muted-foreground">{t("allRecipesDisplayed")}</p>
        </div>
      ) : null}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              {t("deleteDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("deleteDialog.description", { title: recipeToDelete?.title || "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deleting === recipeToDelete?.id}
              className="flex-1"
            >
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting === recipeToDelete?.id}
              className="flex-1"
            >
              {deleting === recipeToDelete?.id ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>,
    true
  );
}
