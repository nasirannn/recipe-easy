"use client";

import { useLocale, useTranslations } from "next-intl";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { Bookmark, ChefHat, Clock3, Copy, Lightbulb, Loader2, RefreshCw, ShoppingBasket, Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Recipe, RecipeFormData } from "@/lib/types";
import { LanguageModel, ImageModel } from "@/lib/types";
import type { HomeRecipePreview } from "@/lib/home-types";
import { RecipeForm } from "@/components/ui/recipe-form";
import { RecipeDisplay } from "@/components/ui/recipe-display";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/lib/config";
import { RecipeListCard, RecipeListCardSkeleton } from "@/components/recipe/recipe-list-card";
import { useAuth } from "@/contexts/auth-context";
import { useUserUsage } from "@/hooks/use-user-usage";
import { useRecipeGeneration } from "@/hooks/use-recipe-generation";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useRecipeSave } from "@/hooks/use-recipe-save";
import { getMealTypeLabel } from "@/lib/meal-type";
import { withLocalePath } from "@/lib/utils/locale-path";
import { buildAuthPath } from "@/lib/utils/auth-path";
import { isAuthRequiredError } from "@/lib/utils/auth-error";
import { normalizeRecipeVibe } from "@/lib/vibe";
import { toast } from "sonner";

interface WorkspaceSectionProps {
  initialRecentRecipes: HomeRecipePreview[];
}

export const WorkspaceSection = ({ initialRecentRecipes }: WorkspaceSectionProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tRecipeDisplay = useTranslations("recipeDisplay");
  const isZhLocale = locale.toLowerCase().startsWith("zh");
  const { user } = useAuth();
  const { credits } = useUserUsage();
  const canGenerateImage = (credits?.credits ?? 0) >= APP_CONFIG.imageGenerationCost;
  const explorePath = withLocalePath(locale, "/explore");

  const {
    loading,
    recipes,
    error,
    generateRecipe,
    regenerateRecipe,
    setRecipes,
  } = useRecipeGeneration();

  const { imageGenerating, imageLoadingStates, regenerateImage } = useImageGeneration();
  const { saveRecipe, saveRecipes } = useRecipeSave();

  const [formData, setFormData] = useState<RecipeFormData>({
    ingredients: [],
    servings: 2,
    recipeCount: 1,
    cookingTime: "medium",
    vibe: "quick",
    mealType: "any",
    cuisine: "any",
    languageModel: (locale === "zh" ? "QWENPLUS" : "GPT4o_MINI") as LanguageModel,
    imageModel: (locale === "zh" ? "wanx" : "flux") as ImageModel,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      languageModel: (locale === "zh" ? "QWENPLUS" : "GPT4o_MINI") as LanguageModel,
      imageModel: (locale === "zh" ? "wanx" : "flux") as ImageModel,
    }));
  }, [locale]);

  const [searchedIngredients, setSearchedIngredients] = useState<RecipeFormData["ingredients"]>([]);
  const [showRecipe, setShowRecipe] = useState(false);
  const [recentRecipes, setRecentRecipes] = useState<HomeRecipePreview[]>(initialRecentRecipes);
  const [recentRecipesLoading, setRecentRecipesLoading] = useState(false);
  const [sidebarSaving, setSidebarSaving] = useState(false);
  const authPath = useMemo(() => {
    const query = searchParams.toString();
    const currentPath = query ? `${pathname}?${query}` : pathname;
    return buildAuthPath(locale, currentPath);
  }, [locale, pathname, searchParams]);
  const autoSavedRecipeIdsRef = useRef<Set<string>>(new Set());
  const autoSavingRecipeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    autoSavedRecipeIdsRef.current.clear();
    autoSavingRecipeIdsRef.current.clear();
  }, [user?.id]);

  const autoSaveGeneratedRecipes = useCallback(
    async (generatedRecipes: Recipe[]) => {
      if (!user?.id || generatedRecipes.length === 0) {
        return;
      }

      const seen = new Set<string>();
      const recipesToSave = generatedRecipes.filter((recipe) => {
        if (!recipe?.id || seen.has(recipe.id)) {
          return false;
        }
        seen.add(recipe.id);

        return (
          !autoSavedRecipeIdsRef.current.has(recipe.id) &&
          !autoSavingRecipeIdsRef.current.has(recipe.id)
        );
      });

      if (recipesToSave.length === 0) {
        return;
      }

      recipesToSave.forEach((recipe) => {
        autoSavingRecipeIdsRef.current.add(recipe.id);
      });

      try {
        await saveRecipes(recipesToSave, user.id);
        recipesToSave.forEach((recipe) => {
          autoSavedRecipeIdsRef.current.add(recipe.id);
        });
      } catch (saveError) {
        if (isAuthRequiredError(saveError)) {
          router.push(authPath);
          return;
        }
        const errorMessage =
          saveError instanceof Error
            ? saveError.message
            : locale === "zh"
              ? "自动保存失败，请稍后重试"
              : "Auto-save failed, please try again";
        toast.error(errorMessage);
      } finally {
        recipesToSave.forEach((recipe) => {
          autoSavingRecipeIdsRef.current.delete(recipe.id);
        });
      }
    },
    [authPath, locale, router, saveRecipes, user?.id]
  );

  useEffect(() => {
    if (!loading && recipes.length > 0 && showRecipe) {
      const timer = setTimeout(() => {
        const recipeDisplayContainer = document.querySelector(".recipe-display-container");
        if (recipeDisplayContainer) {
          recipeDisplayContainer.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [loading, recipes.length, showRecipe]);

  useEffect(() => {
    setRecentRecipes(initialRecentRecipes);
    setRecentRecipesLoading(false);
  }, [initialRecentRecipes]);

  const handleRegenerateRecipe = useCallback(
    async (event: CustomEvent) => {
      const { ingredients, recipe } = event.detail;

      setFormData((prev) => ({
        ...prev,
        ingredients,
      }));

      setTimeout(() => {
        const loadingContainer = document.getElementById("loading-animation-container");
        if (loadingContainer) {
          loadingContainer.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);

      try {
        const generatedRecipes = await regenerateRecipe(ingredients, recipe, {
          ingredients,
          servings: 2,
          recipeCount: 1,
          cookingTime: "medium",
          vibe: "quick",
          mealType: "any",
          cuisine: "any",
          languageModel: (locale === "zh" ? "QWENPLUS" : "GPT4o_MINI") as LanguageModel,
          imageModel: (locale === "zh" ? "wanx" : "flux") as ImageModel,
        });
        setSearchedIngredients(ingredients);

        if (generatedRecipes.length > 0) {
          setShowRecipe(true);
          void autoSaveGeneratedRecipes(generatedRecipes);
        }
      } catch (regenerateError) {
        if (isAuthRequiredError(regenerateError)) {
          router.push(authPath);
          return;
        }
      }
    },
    [authPath, autoSaveGeneratedRecipes, regenerateRecipe, locale, router]
  );

  useEffect(() => {
    window.addEventListener("regenerateRecipe", handleRegenerateRecipe as EventListener);

    return () => {
      window.removeEventListener("regenerateRecipe", handleRegenerateRecipe as EventListener);
    };
  }, [handleRegenerateRecipe]);

  const handleFormChange = (data: RecipeFormData) => {
    setFormData(data);
  };

  const handleRegenerateImage = async (recipeId: string, recipe: Recipe) => {
    if (!user?.id) {
      router.push(authPath);
      return;
    }

    if (!canGenerateImage) {
      toast.error(
        locale === "zh"
          ? `积分不足，无法重新生成图片。每次生成需要 ${APP_CONFIG.imageGenerationCost} 个积分。`
          : `Insufficient credits to regenerate image. Each generation requires ${APP_CONFIG.imageGenerationCost} credits.`
      );
      return;
    }

    try {
      let generatedImageUrl: string | null = null;

      await regenerateImage(recipeId, recipe, formData.imageModel, (imageUrl) => {
        generatedImageUrl = imageUrl;
        setRecipes((prevRecipes) =>
          prevRecipes.map((currentRecipe) =>
            currentRecipe.id === recipeId
              ? { ...currentRecipe, imagePath: imageUrl }
              : currentRecipe
          )
        );
      });

      if (!generatedImageUrl) {
        throw new Error(
          locale === "zh" ? "图片生成成功，但未返回可保存的图片地址。" : "Image generated without a persistable URL."
        );
      }

      const saveResult = await saveRecipe(
        {
          ...recipe,
          imagePath: generatedImageUrl,
          imageModel: formData.imageModel,
        },
        user.id
      );

      const persistedImagePath =
        Array.isArray(saveResult?.recipes) && saveResult.recipes[0]?.imagePath
          ? String(saveResult.recipes[0].imagePath)
          : generatedImageUrl;

      if (persistedImagePath !== generatedImageUrl) {
        setRecipes((prevRecipes) =>
          prevRecipes.map((currentRecipe) =>
            currentRecipe.id === recipeId
              ? { ...currentRecipe, imagePath: persistedImagePath }
              : currentRecipe
          )
        );
      }

      if (recipe.id) {
        autoSavedRecipeIdsRef.current.add(recipe.id);
      }

      toast.success(
        locale === "zh"
          ? `图片重新生成并保存成功！已消耗 ${APP_CONFIG.imageGenerationCost} 个积分。`
          : `Image regenerated and saved successfully! ${APP_CONFIG.imageGenerationCost} credits consumed.`
      );
    } catch (regenerateError) {
      if (isAuthRequiredError(regenerateError)) {
        router.push(authPath);
        return;
      }
      const errorMessage =
        regenerateError instanceof Error
          ? regenerateError.message
          : locale === "zh"
            ? "图片重新生成失败，请稍后重试"
            : "Failed to regenerate image, please try again";

      toast.error(errorMessage);
    }
  };

  const handleSubmit = async () => {
    try {
      const generatedRecipes = await generateRecipe(formData);
      setSearchedIngredients(formData.ingredients);

      if (generatedRecipes.length > 0) {
        setShowRecipe(true);
        void autoSaveGeneratedRecipes(generatedRecipes);
      }
    } catch (submitError) {
      if (isAuthRequiredError(submitError)) {
        router.push(authPath);
      }
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!user?.id) {
      router.push(authPath);
      return;
    }

    try {
      await saveRecipe(recipe, user.id);
      if (recipe.id) {
        autoSavedRecipeIdsRef.current.add(recipe.id);
      }
      toast.success(locale === "zh" ? "菜谱保存成功！" : "Recipe saved successfully!");
    } catch (saveError) {
      if (isAuthRequiredError(saveError)) {
        router.push(authPath);
        return;
      }
      const errorMessage =
        saveError instanceof Error
          ? saveError.message
          : locale === "zh"
            ? "保存菜谱失败，请稍后重试"
            : "Failed to save recipe, please try again";
      toast.error(errorMessage);
    }
  };

  const parseJsonArray = (data: unknown): string[] => {
    if (Array.isArray(data)) {
      return data as string[];
    }

    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? (parsed as string[]) : [];
      } catch {
        return [];
      }
    }

    return [];
  };

  const getVibeLabel = (vibe?: string | null): string => {
    if (!vibe) {
      return "";
    }
    switch (normalizeRecipeVibe(vibe, "comfort")) {
      case "quick":
        return tRecipeDisplay("quick");
      case "gourmet":
        return tRecipeDisplay("gourmet");
      case "healthy":
        return tRecipeDisplay("healthy");
      case "comfort":
      default:
        return tRecipeDisplay("comfort");
    }
  };

  const activeRecipe = recipes[0] ?? null;
  const effectiveIngredientsForRegenerate =
    searchedIngredients.length > 0 ? searchedIngredients : formData.ingredients;

  const handleCopyActiveRecipe = async () => {
    if (!activeRecipe) {
      return;
    }

    const ingredients = parseJsonArray(activeRecipe.ingredients);
    const seasoning = parseJsonArray(activeRecipe.seasoning);
    const instructions = parseJsonArray(activeRecipe.instructions);
    const chefTips = parseJsonArray(activeRecipe.chefTips);

    const allContent = [
      activeRecipe.title,
      "",
      activeRecipe.description || "",
      "",
      `${tRecipeDisplay("ingredients")}:`,
      ...ingredients.map((ingredient) => `• ${ingredient}`),
      "",
      `${tRecipeDisplay("seasoning")}:`,
      ...seasoning.map((season) => `• ${season}`),
      "",
      `${tRecipeDisplay("instructions")}:`,
      ...instructions.map((instruction, instructionIndex) => `${instructionIndex + 1}. ${instruction}`),
      "",
      `${tRecipeDisplay("chefTips")}:`,
      ...chefTips.map((tip) => `• ${tip}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(allContent);
      toast.success(isZhLocale ? "菜谱已复制" : "Recipe copied");
    } catch {
      toast.error(isZhLocale ? "复制失败，请重试" : "Copy failed, please try again");
    }
  };

  const handleRegenerateFromSidebar = () => {
    if (!activeRecipe || effectiveIngredientsForRegenerate.length === 0) {
      return;
    }

    const event = new CustomEvent("regenerateRecipe", {
      detail: {
        ingredients: effectiveIngredientsForRegenerate,
        recipe: activeRecipe,
      },
    });
    window.dispatchEvent(event);
  };

  const copy = isZhLocale
    ? {
        badge: "AI 智能烹饪工作台",
        titleLead: "一起做点",
        titleAccent: "不一样的美味",
        titleTrail: "",
        description: "告诉我你现在有哪些食材，设置偏好后，AI 会在几秒内生成可落地的菜谱和配图。",
        fridgeTitle: "What's in your fridge?",
        fridgeDescription: "输入区域已替换为当前食材选择区：先选食材，再一键生成菜谱。",
        recentTitle: "Recent Generations",
        viewAll: "查看全部菜谱",
        emptyRecent: "还没有最近生成且带图片的菜谱。",
        tipTitle: "Chef's Tip",
        tipContent: "先选择 2-6 个核心食材，再设置 Vibe、Meal Type、Cuisine 和 Servings，生成结果会更贴合你的需求。",
      }
    : {
        badge: "AI Cooking Workspace",
        titleLead: "Let's cook something",
        titleAccent: "extraordinary",
        titleTrail: ".",
        description:
          "Tell us what ingredients you have, set your preferences, and our AI chef will handle the rest in seconds.",
        fridgeTitle: "What's in your fridge?",
        fridgeDescription:
          "The input area now uses your current ingredient selection workspace for faster, structured input.",
        recentTitle: "Recent Generations",
        viewAll: "View all recipes",
        emptyRecent: "No recent recipes with images available yet.",
        tipTitle: "Chef's Tip",
        tipContent:
          "Pick 2-6 core ingredients, then set Vibe, Meal Type, Cuisine, and Servings for more tailored results.",
      };

  return (
    <section className="relative isolate overflow-hidden py-8 md:py-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-28 left-[-14%] h-[24rem] w-[24rem] rounded-full bg-primary/16 blur-3xl dark:bg-primary/20" />
        <div className="absolute -top-28 right-[-12%] h-[24rem] w-[24rem] rounded-full bg-emerald-300/16 blur-3xl dark:bg-emerald-400/14" />
      </div>

      <div className="relative z-10 home-inner">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-8">
              <header className="space-y-3">
                <h1 className="text-[2.85rem] font-bold leading-[0.98] tracking-[-0.03em] text-foreground sm:text-5xl md:text-[3.55rem]">
                  <span className="block">{copy.titleLead}</span>
                  <span className="block text-primary">
                    {copy.titleAccent}
                    {copy.titleTrail ? <span className="text-foreground">{copy.titleTrail}</span> : null}
                  </span>
                </h1>
                <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
                  {copy.description}
                </p>
              </header>

              <div className="space-y-4">
                <h2 className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-foreground md:text-3xl">
                  <ShoppingBasket className="h-6 w-6 text-primary" />
                  {copy.fridgeTitle}
                </h2>
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  {copy.fridgeDescription}
                </p>

                <div id="recipe-form-section">
                  <RecipeForm
                    formData={formData}
                    onFormChange={handleFormChange}
                    onSubmit={handleSubmit}
                    loading={loading || imageGenerating}
                    showRecipe={showRecipe}
                    setShowRecipe={setShowRecipe}
                    remainingCredits={credits?.credits}
                  />
                </div>
              </div>

              {showRecipe ? (
                <div id="loading-animation-container" className="pt-2">
                  {loading ? (
                    <LoadingAnimation language={locale as "en" | "zh"} />
                  ) : (
                    <RecipeDisplay
                      recipes={recipes}
                      imageLoadingStates={imageLoadingStates}
                      onRegenerateImage={handleRegenerateImage}
                    />
                  )}
                  {error ? (
                    <div className="mx-auto mt-6 max-w-screen-md rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
                      {error}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <aside className="w-full space-y-4 lg:w-[22rem] lg:shrink-0 lg:self-start lg:border-l lg:border-border-45 lg:pl-6">
              {showRecipe && !loading && activeRecipe ? (
                <div className="rounded-xl border border-border-70 bg-card-95 p-4">
                  <h3 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
                    {tRecipeDisplay("quickInfo")}
                  </h3>

                  <div className="mt-4 space-y-3">
                    {activeRecipe.cookingTime ? (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          {tRecipeDisplay("cookTime")}
                        </span>
                        <span className="font-semibold text-foreground">
                          {activeRecipe.cookingTime} {tRecipeDisplay("mins")}
                        </span>
                      </div>
                    ) : null}

                    {activeRecipe.servings ? (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {tRecipeDisplay("serves")}
                        </span>
                        <span className="font-semibold text-foreground">{activeRecipe.servings}</span>
                      </div>
                    ) : null}

                    {activeRecipe.vibe ? (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <ChefHat className="h-3.5 w-3.5" />
                          {tRecipeDisplay("vibe")}
                        </span>
                        <span className="rounded-md bg-muted px-2 py-1 font-semibold text-foreground">
                          {getVibeLabel(activeRecipe.vibe)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <Button
                      className="min-h-11 w-full"
                      disabled={sidebarSaving}
                      onClick={async () => {
                        if (!activeRecipe) {
                          return;
                        }
                        setSidebarSaving(true);
                        try {
                          await handleSaveRecipe(activeRecipe);
                        } finally {
                          setSidebarSaving(false);
                        }
                      }}
                    >
                      {sidebarSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Bookmark className="mr-2 h-4 w-4" />
                      )}
                      {tRecipeDisplay("saveRecipe")}
                    </Button>

                    <Button variant="outline" className="min-h-11 w-full" onClick={handleCopyActiveRecipe}>
                      <Copy className="mr-2 h-4 w-4" />
                      {tRecipeDisplay("copyFullRecipe")}
                    </Button>

                    <Button
                      variant="outline"
                      className="min-h-11 w-full"
                      onClick={handleRegenerateFromSidebar}
                      disabled={effectiveIngredientsForRegenerate.length === 0}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {tRecipeDisplay("regenerate")}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{copy.recentTitle}</h3>
                <Link
                  href={explorePath}
                  className="text-xs font-semibold text-primary transition-colors hover:opacity-80"
                >
                  {copy.viewAll}
                </Link>
              </div>

              {recentRecipesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <RecipeListCardSkeleton
                      key={`workspace-recent-skeleton-${index}`}
                      layout="standard"
                      mediaClassName="h-32"
                    />
                  ))}
                </div>
              ) : recentRecipes.length > 0 ? (
                <div className="space-y-3">
                  {recentRecipes.map((recipe) => {
                    const normalizedVibe = normalizeRecipeVibe(recipe.vibe, "comfort");
                    const topBadgeLabel =
                      (recipe.mealType ? getMealTypeLabel(recipe.mealType, locale) : undefined) ||
                      recipe.cuisine?.name;

                    return (
                      <RecipeListCard
                        key={`workspace-recent-${recipe.id}`}
                        recipe={recipe}
                        href={withLocalePath(locale, `/recipe/${recipe.id}`)}
                        minsLabel={tRecipeDisplay("mins")}
                        vibeLabel={recipe.vibe ? tRecipeDisplay(normalizedVibe) : undefined}
                        layout="standard"
                        showCoverOverlay={false}
                        showDescription={false}
                        mediaClassName="h-32"
                        topLeftContent={
                          topBadgeLabel ? (
                            <span className="inline-flex items-center rounded-full bg-background-80 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
                              {topBadgeLabel}
                            </span>
                          ) : undefined
                        }
                        prefetch={false}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-border-55 bg-background-45 p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{copy.emptyRecent}</p>
                </div>
              )}

              <div className="rounded-xl border border-primary/35 bg-primary/5 p-4">
                <div className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{copy.tipTitle}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{copy.tipContent}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
};
