"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Check, ChefHat, Clock, Flame, Info, Lightbulb, ListOrdered, Loader2, MoreHorizontal, Share2, Sparkles, ShoppingBasket, Tags as TagsIcon, Users, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";
import { getImageUrl } from "@/lib/config";
import { normalizeRecipeVibe } from "@/lib/vibe";
import { useAuth } from "@/contexts/auth-context";
import { useUserUsage } from "@/hooks/use-user-usage";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useRecipeSave } from "@/hooks/use-recipe-save";
import { buildAuthPath } from "@/lib/utils/auth-path";
import { isAuthRequiredError } from "@/lib/utils/auth-error";
import { overlayIconButtonClass } from "@/lib/utils/button-styles";
import { toast } from "sonner";

type RecipeDetailRecipe = Omit<Recipe, "created_at" | "updated_at" | "vibe" | "cuisine"> & {
  vibe: string;
  cuisine?: {
    id: number;
    name: string;
    slug?: string;
  };
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

interface RecipeDetailProps {
  recipe: RecipeDetailRecipe;
  locale: string;
}

type CopySection = "ingredients" | "seasoning" | "instructions" | "full" | "link";

type StatCard = {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
};

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function formatCaloriesValue(value: number | null | undefined, fallback: string): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallback;
  }

  const normalized = Number(value);
  const displayValue = Number.isInteger(normalized) ? normalized.toString() : normalized.toFixed(1);
  return `${displayValue} kcal`;
}

function parseJsonArray(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed)
        ? parsed.map((item) => String(item).trim()).filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

export const RecipeDetail = ({ recipe, locale }: RecipeDetailProps) => {
  const t = useTranslations("recipeDisplay");
  const isZh = locale.toLowerCase().startsWith("zh");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, session } = useAuth();
  const { credits } = useUserUsage();
  const { regenerateImage, imageLoadingStates } = useImageGeneration();
  const { saveRecipe } = useRecipeSave();
  const [copiedSection, setCopiedSection] = useState<CopySection | null>(null);
  const [isHeroImageLoaded, setIsHeroImageLoaded] = useState(false);
  const [hasHeroImageError, setHasHeroImageError] = useState(false);
  const [currentImagePath, setCurrentImagePath] = useState<string | undefined>(recipe.imagePath);
  const [isPersistingImage, setIsPersistingImage] = useState(false);
  const [isHeroPreviewOpen, setIsHeroPreviewOpen] = useState(false);
  const [isGenerateCoverConfirmOpen, setIsGenerateCoverConfirmOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);
  const servingsCount = Math.max(1, Number(recipe.servings) || 2);
  const canGenerateImage = (credits?.credits ?? 0) >= APP_CONFIG.imageGenerationCost;
  const isRecipeOwner = Boolean(user?.id && recipe.userId && user.id === recipe.userId);
  const selectedImageModel: "wanx" | "flux" =
    recipe.imageModel === "wanx" || recipe.imageModel === "flux"
      ? recipe.imageModel
      : (isZh ? "wanx" : "flux");
  const authPath = (() => {
    const query = searchParams.toString();
    const currentPath = query ? `${pathname}?${query}` : pathname;
    return buildAuthPath(locale, currentPath);
  })();

  const ingredients = parseJsonArray(recipe.ingredients);
  const seasoning = parseJsonArray(recipe.seasoning);
  const instructions = parseJsonArray(recipe.instructions);
  const chefTips = parseJsonArray(recipe.chefTips);
  const tags = parseJsonArray(recipe.tags);

  const getVibeLabel = (vibe: string) => {
    switch (normalizeRecipeVibe(vibe, "comfort")) {
      case "quick":
        return isZh ? "快手" : "Quick";
      case "gourmet":
        return isZh ? "精致" : "Gourmet";
      case "healthy":
        return isZh ? "健康" : "Healthy";
      case "comfort":
      default:
        return isZh ? "家常" : "Comfort";
    }
  };

  const stats: StatCard[] = [
    {
      id: "cook-time",
      label: t("cookTime"),
      value: recipe.cookingTime ? `${recipe.cookingTime} ${t("mins")}` : (isZh ? "待定" : "TBD"),
      icon: Clock,
    },
    {
      id: "serves",
      label: t("serves"),
      value: String(servingsCount),
      icon: Users,
    },
    {
      id: "vibe",
      label: t("vibe"),
      value: recipe.vibe ? getVibeLabel(recipe.vibe) : (isZh ? "待定" : "TBD"),
      icon: ChefHat,
    },
    {
      id: "calories",
      label: isZh ? "卡路里" : "Calories",
      value: formatCaloriesValue(recipe.nutrition?.calories, isZh ? "待定" : "TBD"),
      icon: Flame,
    },
  ];

  const labels = isZh
    ? {
        copyRecipe: "复制",
        share: "分享",
        more: "更多",
        addFavorite: "收藏菜谱",
        removeFavorite: "取消收藏",
        previewCover: "查看大图",
        previewCoverTitle: "封面大图预览",
        generateCover: "生成封面图",
        generateCoverDialogTitle: "确认生成封面图",
        generateCoverDialogDescription: "将根据当前菜谱内容生成一张封面图，并自动保存到该菜谱。",
        generateCoverDialogCost: `本次操作将消耗 ${APP_CONFIG.imageGenerationCost} 个积分。`,
        cancelAction: "取消",
        confirmGenerateAction: "确认生成",
        generatingAction: "生成中...",
        copied: "已复制",
        linkCopied: "链接已复制",
        ingredientsTitle: "Ingredients",
        seasoningTitle: "Seasoning",
        instructionsTitle: "Instructions",
        tagsTitle: "标签",
        tipsTitle: "ChefAI Tips",
        tipsFallback:
          "先用干锅将藜麦轻炒 2 分钟，再加水煮制，可以获得更浓郁的坚果香气。",
        nutritionTitle: "每份营养信息",
        nutritionNote: "估算值基于常见食材，不包含可选装饰配料。",
        nutritionCalories: "卡路里",
        nutritionProtein: "蛋白质",
        nutritionCarbohydrates: "碳水",
        nutritionFat: "脂肪",
        nutritionFiber: "纤维",
        nutritionSugar: "糖",
        pairingTypeFallback: "Drink",
        pairingNameFallback: "待定",
        pairingDescriptionFallback: "当前菜谱暂未生成饮品搭配说明。",
      }
    : {
        copyRecipe: "Copy",
        share: "Share",
        more: "More",
        addFavorite: "Save recipe",
        removeFavorite: "Remove favorite",
        previewCover: "View full-size image",
        previewCoverTitle: "Cover image preview",
        generateCover: "Generate Cover",
        generateCoverDialogTitle: "Generate cover image",
        generateCoverDialogDescription: "A new cover will be generated from this recipe and saved automatically.",
        generateCoverDialogCost: `This action will consume ${APP_CONFIG.imageGenerationCost} credits.`,
        cancelAction: "Cancel",
        confirmGenerateAction: "Generate",
        generatingAction: "Generating...",
        copied: "Copied",
        linkCopied: "Link copied",
        ingredientsTitle: "Ingredients",
        seasoningTitle: "Seasoning",
        instructionsTitle: "Instructions",
        tagsTitle: "Tags",
        tipsTitle: "ChefAI Tips",
        tipsFallback:
          "Toast the grains for 2 minutes before simmering to bring out extra nutty flavor.",
        nutritionTitle: "Nutrition per serving",
        nutritionNote: "Estimated values based on standard ingredients. Optional garnishes not included.",
        nutritionCalories: "Calories",
        nutritionProtein: "Protein",
        nutritionCarbohydrates: "Carbohydrates",
        nutritionFat: "Fat",
        nutritionFiber: "Fiber",
        nutritionSugar: "Sugar",
        pairingTypeFallback: "Drink",
        pairingNameFallback: "TBD",
        pairingDescriptionFallback: "Pairing notes are not available for this recipe yet.",
      };

  const copyToClipboard = async (text: string, section: CopySection) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 1800);
    } catch {
      // Ignore copy failures to avoid interrupting user flow.
    }
  };

  const handleCopyFullRecipe = async () => {
    const content = [
      recipe.title,
      recipe.description ? `\n${recipe.description}` : "",
      ingredients.length > 0
        ? `\n${t("ingredients")}:\n${ingredients.map((item) => `• ${item}`).join("\n")}`
        : "",
      seasoning.length > 0
        ? `\n${t("seasoning")}:\n${seasoning.map((item) => `• ${item}`).join("\n")}`
        : "",
      instructions.length > 0
        ? `\n${t("instructions")}:\n${instructions
            .map((item, index) => `${index + 1}. ${item}`)
            .join("\n")}`
        : "",
      chefTips.length > 0
        ? `\n${t("chefTips")}:\n${chefTips.map((tip) => `• ${tip}`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    await copyToClipboard(content, "full");
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: currentUrl,
        });
        return;
      } catch {
        // User dismissed native share panel.
      }
    }

    await copyToClipboard(currentUrl, "link");
  };

  const fallbackHeroImage = "/images/recipe-placeholder-bg.png";
  const primaryHeroImage = currentImagePath ? getImageUrl(currentImagePath) : null;
  const heroImage = hasHeroImageError || !primaryHeroImage ? fallbackHeroImage : primaryHeroImage;
  const shouldShowHeroImage = Boolean(heroImage);
  const canOpenHeroPreview = Boolean(primaryHeroImage);
  const shouldShowHeroSkeleton = !shouldShowHeroImage || !isHeroImageLoaded;
  const hasCoverImage = Boolean(currentImagePath);
  const shouldShowGenerateCoverButton = isRecipeOwner && !hasCoverImage;
  const shouldShowActionMenu = !hasCoverImage && shouldShowGenerateCoverButton;
  const shouldShowInlineCopyShare = hasCoverImage || !shouldShowGenerateCoverButton;
  const isCoverImageLoading = Boolean(imageLoadingStates[recipe.id]) || isPersistingImage;
  const primaryTags = tags.length > 0 ? tags.slice(0, 2) : [getVibeLabel(recipe.vibe || "comfort")];
  const detailTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  const mainTip = chefTips[0] || labels.tipsFallback;
  const pairingType = normalizeText(recipe.pairing?.type);
  const pairingTitle = `${toTitleCase(pairingType ?? labels.pairingTypeFallback)} Pairing`;
  const pairingName = normalizeText(recipe.pairing?.name) ?? labels.pairingNameFallback;
  const pairingNote = normalizeText(recipe.pairing?.note);
  const pairingDescription =
    normalizeText(recipe.pairing?.description) ?? labels.pairingDescriptionFallback;
  const nutritionRows = [
    { label: labels.nutritionCalories, value: recipe.nutrition?.calories ?? null, unit: "kcal" },
    { label: labels.nutritionProtein, value: recipe.nutrition?.protein ?? null },
    { label: labels.nutritionCarbohydrates, value: recipe.nutrition?.carbohydrates ?? null },
    { label: labels.nutritionFat, value: recipe.nutrition?.fat ?? null },
    { label: labels.nutritionFiber, value: recipe.nutrition?.fiber ?? null },
    { label: labels.nutritionSugar, value: recipe.nutrition?.sugar ?? null },
  ];
  const hasNutritionData = nutritionRows.some((item) => item.value !== null && item.value !== undefined);

  const formatNutritionValue = (value: number | null | undefined, unit = "g") => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "--";
    }
    const normalized = Number(value);
    const displayValue = Number.isInteger(normalized) ? normalized.toString() : normalized.toFixed(1);
    return `${displayValue}${unit === "kcal" ? " kcal" : "g"}`;
  };

  const handleOpenGenerateCoverConfirm = () => {
    if (!user?.id) {
      router.push(authPath);
      return;
    }

    setIsGenerateCoverConfirmOpen(true);
  };

  const handleToggleFavorite = async () => {
    if (!user?.id || !session?.access_token) {
      router.push(authPath);
      return;
    }

    const previousFavorite = isFavorite;
    const nextFavorite = !previousFavorite;
    setIsFavorite(nextFavorite);
    setIsFavoriteUpdating(true);

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

      setIsFavorite(result.favorite);
    } catch {
      setIsFavorite(previousFavorite);
    } finally {
      setIsFavoriteUpdating(false);
    }
  };

  const handleGenerateCoverImage = async () => {
    if (!user?.id) {
      router.push(authPath);
      return;
    }

    if (!canGenerateImage) {
      toast.error(
        isZh
          ? `积分不足，生成图片需要 ${APP_CONFIG.imageGenerationCost} 个积分。`
          : `Insufficient credits. Image generation requires ${APP_CONFIG.imageGenerationCost} credits.`
      );
      return;
    }

    const previousImagePath = currentImagePath;
    let didPersist = false;

    try {
      let generatedImageUrl: string | null = null;

      await regenerateImage(
        recipe.id,
        {
          ...recipe,
          vibe: normalizeRecipeVibe(recipe.vibe, "comfort"),
          imagePath: currentImagePath,
        } as Recipe,
        selectedImageModel,
        (imageUrl) => {
          generatedImageUrl = imageUrl;
          setCurrentImagePath(imageUrl);
          setHasHeroImageError(false);
          setIsHeroImageLoaded(false);
        }
      );

      if (!generatedImageUrl) {
        throw new Error(isZh ? "图片生成成功，但未返回可保存地址。" : "Image generated without a persistable URL.");
      }

      setIsPersistingImage(true);

      const saveResult = await saveRecipe(
        {
          ...recipe,
          vibe: normalizeRecipeVibe(recipe.vibe, "comfort"),
          imagePath: generatedImageUrl,
          imageModel: selectedImageModel,
        } as Recipe,
        user.id
      );

      const persistedImagePath =
        Array.isArray(saveResult?.recipes) && saveResult.recipes[0]?.imagePath
          ? String(saveResult.recipes[0].imagePath)
          : generatedImageUrl;

      setCurrentImagePath(persistedImagePath);
      setHasHeroImageError(false);
      setIsHeroImageLoaded(false);
      didPersist = true;
      setIsGenerateCoverConfirmOpen(false);
      router.refresh();

      toast.success(
        isZh
          ? `图片生成并保存成功！已消耗 ${APP_CONFIG.imageGenerationCost} 个积分。`
          : `Image generated and saved! ${APP_CONFIG.imageGenerationCost} credits consumed.`
      );
    } catch (error) {
      if (!didPersist) {
        setCurrentImagePath(previousImagePath);
        setHasHeroImageError(false);
        setIsHeroImageLoaded(false);
      }

      if (isAuthRequiredError(error)) {
        router.push(authPath);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : isZh
            ? "生成图片失败，请稍后重试"
            : "Failed to generate image, please try again";
      toast.error(message);
    } finally {
      setIsPersistingImage(false);
    }
  };

  useEffect(() => {
    setIsHeroImageLoaded(false);
    setHasHeroImageError(false);
  }, [primaryHeroImage]);

  useEffect(() => {
    if (!user?.id || !session?.access_token) {
      setIsFavorite(false);
      setIsFavoriteLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadFavoriteStatus = async () => {
      try {
        setIsFavoriteLoading(true);
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
            if (isMounted) {
              setIsFavorite(false);
            }
            return;
          }
          throw new Error("Failed to load favorite recipes");
        }

        const result = (await response.json()) as {
          success?: boolean;
          favoriteRecipeIds?: string[];
        };

        if (!result.success) {
          throw new Error("Failed to load favorite recipes");
        }

        const favoriteIds = Array.isArray(result.favoriteRecipeIds)
          ? result.favoriteRecipeIds.map((item) => String(item)).filter(Boolean)
          : [];

        if (isMounted) {
          setIsFavorite(favoriteIds.includes(recipe.id));
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        if (isMounted) {
          setIsFavorite(false);
        }
      } finally {
        if (isMounted) {
          setIsFavoriteLoading(false);
        }
      }
    };

    loadFavoriteStatus();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [recipe.id, session?.access_token, user?.id]);

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 md:px-10 lg:pb-16">
        <section className="group relative mb-8 overflow-hidden rounded-xl">
          <div className="relative min-h-[380px] sm:min-h-[420px]">
            {shouldShowHeroSkeleton && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/70 via-muted/50 to-muted/30" />
            )}
            {shouldShowHeroImage && (
              <Image
                key={heroImage || "no-hero-image"}
                src={heroImage as string}
                alt={recipe.title}
                fill
                priority
                unoptimized={true}
                sizes="(max-width: 768px) 100vw, 1200px"
                className={cn(
                  "object-cover transition-all duration-700 group-hover:scale-[1.02]",
                  isHeroImageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setIsHeroImageLoaded(true)}
                onError={() => {
                  setIsHeroImageLoaded(false);
                  if (!hasHeroImageError) {
                    setHasHeroImageError(true);
                  }
                }}
              />
            )}
            <div
              className={cn(
                "absolute inset-0",
                shouldShowHeroImage
                  ? "bg-linear-to-t from-black/90 via-black/45 to-black/10"
                  : "bg-linear-to-t from-black/78 via-black/42 to-black/12"
              )}
            />
            {canOpenHeroPreview ? (
              <button
                type="button"
                aria-label={labels.previewCover}
                onClick={() => setIsHeroPreviewOpen(true)}
                className="absolute inset-0 z-[15] cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
              />
            ) : null}
            <div className="absolute right-4 top-4 z-20 sm:right-5 sm:top-5">
              <button
                type="button"
                aria-pressed={isFavorite}
                aria-label={isFavorite ? labels.removeFavorite : labels.addFavorite}
                onClick={handleToggleFavorite}
                disabled={isFavoriteLoading || isFavoriteUpdating}
                className={overlayIconButtonClass({
                  active: isFavorite,
                  disabled: isFavoriteLoading || isFavoriteUpdating,
                  className: "h-9 w-9 shadow-md",
                })}
              >
                <Bookmark className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              </button>
            </div>

            <div className="relative z-20 flex min-h-[380px] flex-col justify-end p-6 pointer-events-none sm:min-h-[420px] sm:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {primaryTags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                      index === 0
                        ? "bg-primary text-primary-foreground"
                        : "border border-white/30 bg-black/45 text-white backdrop-blur-sm"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <h1 className="text-balance text-4xl font-bold tracking-tight text-white drop-shadow-[0_1px_1px_rgba(2,6,23,0.7)] md:text-5xl lg:text-6xl">
                    {recipe.title}
                  </h1>
                  {recipe.description && (
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
                      {recipe.description}
                    </p>
                  )}
                </div>

                <div className="pointer-events-auto flex flex-nowrap items-center gap-2.5 overflow-x-auto pb-1">
                  {shouldShowGenerateCoverButton ? (
                    <Button
                      type="button"
                      className="h-10 shrink-0 gap-2 whitespace-nowrap bg-primary px-4 font-bold text-primary-foreground hover:bg-primary/90"
                      onClick={handleOpenGenerateCoverConfirm}
                      disabled={isCoverImageLoading}
                    >
                      {isCoverImageLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {labels.generateCover}
                    </Button>
                  ) : null}
                  {shouldShowInlineCopyShare ? (
                    <>
                      <Button
                        type="button"
                        className="h-10 shrink-0 gap-2 whitespace-nowrap bg-primary px-4 font-bold text-primary-foreground hover:bg-primary/90"
                        onClick={handleCopyFullRecipe}
                      >
                        {copiedSection === "full" ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                        {copiedSection === "full" ? labels.copied : labels.copyRecipe}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 shrink-0 gap-2 whitespace-nowrap border-recipe-surface-border bg-recipe-overlay-mid px-4 font-bold !text-white backdrop-blur-sm hover:bg-recipe-overlay-strong hover:!text-white focus-visible:!text-white"
                        onClick={handleShare}
                      >
                        {copiedSection === "link" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                        {copiedSection === "link" ? labels.linkCopied : labels.share}
                      </Button>
                    </>
                  ) : null}
                  {shouldShowActionMenu ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 shrink-0 gap-2 whitespace-nowrap border-recipe-surface-border bg-recipe-overlay-mid px-4 font-bold !text-white backdrop-blur-sm hover:bg-recipe-overlay-strong hover:!text-white focus-visible:!text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          {labels.more}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="theme-surface-base min-w-[176px] border-border-70 bg-background-95 p-1"
                      >
                        <DropdownMenuItem
                          className="cursor-pointer rounded-md text-foreground focus:bg-muted-50"
                          onClick={handleCopyFullRecipe}
                        >
                          {copiedSection === "full" ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                          {copiedSection === "full" ? labels.copied : labels.copyRecipe}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-md text-foreground focus:bg-muted-50"
                          onClick={handleShare}
                        >
                          {copiedSection === "link" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                          {copiedSection === "link" ? labels.linkCopied : labels.share}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Dialog
          open={isHeroPreviewOpen}
          onOpenChange={setIsHeroPreviewOpen}
        >
          <DialogContent className="theme-surface-base w-[calc(100%-1.5rem)] max-w-[min(1200px,96vw)] overflow-hidden rounded-xl border border-border-70 bg-background-95 p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{labels.previewCoverTitle}</DialogTitle>
            </DialogHeader>
            {heroImage ? (
              <div className="relative h-[78vh] w-full min-h-[340px] bg-black/90">
                <Image
                  src={heroImage}
                  alt={recipe.title}
                  fill
                  unoptimized={true}
                  sizes="96vw"
                  className="object-contain"
                />
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog
          open={isGenerateCoverConfirmOpen}
          onOpenChange={(open) => {
            if (!open && isCoverImageLoading) {
              return;
            }
            setIsGenerateCoverConfirmOpen(open);
          }}
        >
          <DialogContent className="theme-surface-base w-[calc(100%-2rem)] max-w-[430px] rounded-xl border border-border-70 bg-card p-0 shadow-xl">
            <DialogHeader className="border-b border-border-70 px-5 py-4 text-left">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-20 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {labels.generateCoverDialogTitle}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {labels.generateCoverDialogDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="px-5 py-4">
              <div className="rounded-lg border border-border-70 bg-muted-30 px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">
                  {labels.generateCoverDialogCost}
                </p>
              </div>
            </div>

            <DialogFooter className="border-t border-border-70 px-5 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 border-border-70 bg-transparent px-4 text-foreground hover:bg-muted-50"
                onClick={() => setIsGenerateCoverConfirmOpen(false)}
                disabled={isCoverImageLoading}
              >
                {labels.cancelAction}
              </Button>
              <Button
                type="button"
                className="h-10 bg-primary px-4 font-bold text-primary-foreground hover:bg-primary/90"
                onClick={handleGenerateCoverImage}
                disabled={isCoverImageLoading}
              >
                {isCoverImageLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isCoverImageLoading ? labels.generatingAction : labels.confirmGenerateAction}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map(({ id, icon: Icon, label, value }) => (
                <Card key={id} className="rounded-xl border border-border-70 bg-card shadow-sm">
                  <CardContent className="p-4 md:p-5">
                    <div className="mb-1 flex items-center gap-2 text-primary">
                      <Icon className="h-4 w-4" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-foreground md:text-2xl">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {ingredients.length > 0 && (
              <Card className="overflow-hidden rounded-xl border border-border-70 bg-card">
                <div className="flex items-center border-b border-border-70 bg-muted-30 px-5 py-4 sm:px-6">
                  <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                    <ShoppingBasket className="h-5 w-5 text-primary" />
                    {labels.ingredientsTitle}
                  </h2>
                </div>

                <CardContent className="p-5 sm:p-6">
                  <ul className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
                    {ingredients.map((ingredient, index) => (
                      <li key={`${ingredient}-${index}`}>
                        <span className="text-sm leading-6 text-foreground sm:text-base">{ingredient}</span>
                      </li>
                    ))}
                  </ul>

                  {seasoning.length > 0 && (
                    <>
                      <Separator className="my-5" />
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {labels.seasoningTitle}
                        </h3>
                        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {seasoning.map((item, index) => (
                            <li key={`${item}-${index}`} className="flex items-start gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/80" />
                              <span className="text-sm leading-6 text-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {instructions.length > 0 && (
              <Card className="overflow-hidden rounded-xl border border-border-70 bg-card">
                <div className="border-b border-border-70 bg-muted-30 px-5 py-4 sm:px-6">
                  <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                    <ListOrdered className="h-5 w-5 text-primary" />
                    {labels.instructionsTitle}
                  </h2>
                </div>

                <CardContent className="p-5 sm:p-6">
                  <div className="space-y-5">
                    {instructions.map((step, index) => (
                      <div key={`${step}-${index}`} className="flex gap-4">
                        <div className="flex w-8 shrink-0 flex-col items-center">
                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary-20 text-sm font-bold text-primary">
                            {index + 1}
                          </div>
                          {index < instructions.length - 1 ? (
                            <div className="mt-2 h-full w-px bg-border-70" />
                          ) : null}
                        </div>
                        <div className={cn("flex-1", index < instructions.length - 1 ? "pb-4" : "")}>
                          <h3 className="mb-1 text-lg font-semibold text-foreground">
                            {isZh ? `步骤 ${index + 1}` : `Step ${index + 1}`}
                          </h3>
                          <p className="text-sm leading-7 text-muted-foreground sm:text-base">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {detailTags.length > 0 && (
              <Card className="overflow-hidden rounded-xl border border-border-70 bg-card">
                <div className="border-b border-border-70 bg-muted-30 px-5 py-4 sm:px-6">
                  <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
                    <TagsIcon className="h-5 w-5 text-primary" />
                    {labels.tagsTitle}
                  </h2>
                </div>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-wrap gap-2.5">
                    {detailTags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="inline-flex items-center rounded-full border border-border-70 bg-muted-30 px-3 py-1 text-xs font-semibold text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <Card className="relative overflow-hidden rounded-xl border border-primary/30 bg-linear-to-br from-[#1a3324] to-[#102216]">
              <CardContent className="p-6">
                <div className="pointer-events-none absolute right-4 top-4 opacity-20">
                  <Sparkles className="h-14 w-14 text-primary" />
                </div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-primary">
                  <Lightbulb className="h-5 w-5" />
                  {labels.tipsTitle}
                </h3>
                <p className="text-sm leading-relaxed text-slate-200">{mainTip}</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-xl border border-[#2a4b37] bg-linear-to-br from-[#153826] via-[#123224] to-[#112c21] text-[#f1f8f3]">
              <div className="border-b border-[#2f4f3d] px-5 py-4">
                <h3 className="text-base font-bold leading-6 text-[#f1f8f3]">
                  {labels.nutritionTitle}
                </h3>
              </div>
              <CardContent className="px-5 pb-4 pt-2">
                <div className="space-y-1">
                  {nutritionRows.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between border-b border-[#2d4a38] py-2.5 last:border-none"
                    >
                      <span className="text-sm font-medium text-[#a6bdaf]">{item.label}</span>
                      <span className="text-base font-bold tabular-nums text-[#f1f8f3] sm:text-lg">
                        {formatNutritionValue(item.value, item.unit)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-dashed border-[#3d5d4a] pt-4">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-[10px] leading-tight text-[#98b2a2]">
                        {labels.nutritionNote}
                      </p>
                      {!hasNutritionData && (
                        <p className="mt-1 text-[10px] leading-tight text-[#86a092]">
                          {isZh ? "当前菜谱尚未生成营养估算。" : "Nutrition estimates are not available for this recipe yet."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-xl border border-border-70 bg-card">
              <div className="flex items-center justify-between border-b border-border-70 bg-muted-30 px-5 py-4">
                <h3 className="font-bold text-foreground">{pairingTitle}</h3>
                <Wine className="h-5 w-5 text-primary" />
              </div>
              <CardContent className="px-5 pb-5 pt-4">
                <h4 className="text-base font-bold text-foreground">{pairingName}</h4>
                {pairingNote && <p className="mt-1 text-xs text-muted-foreground">{pairingNote}</p>}
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pairingDescription}
                </p>
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </div>
  );
};
