"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Bookmark, Check, ChefHat, Clock, Flame, Info, Lightbulb, ListOrdered, Share2, Sparkles, ShoppingBasket, Users, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/config";
import { normalizeRecipeVibe } from "@/lib/vibe";

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
  const [copiedSection, setCopiedSection] = useState<CopySection | null>(null);
  const [isHeroImageLoaded, setIsHeroImageLoaded] = useState(false);
  const [hasHeroImageError, setHasHeroImageError] = useState(false);
  const servingsCount = Math.max(1, Number(recipe.servings) || 2);

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
        copied: "已复制",
        linkCopied: "链接已复制",
        ingredientsTitle: "Ingredients",
        seasoningTitle: "Seasoning",
        instructionsTitle: "Instructions",
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
        copied: "Copied",
        linkCopied: "Link copied",
        ingredientsTitle: "Ingredients",
        seasoningTitle: "Seasoning",
        instructionsTitle: "Instructions",
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

  const heroImage = recipe.imagePath ? getImageUrl(recipe.imagePath) : null;
  const shouldShowHeroImage = Boolean(heroImage) && !hasHeroImageError;
  const shouldShowHeroSkeleton = !shouldShowHeroImage || !isHeroImageLoaded;
  const primaryTags = tags.length > 0 ? tags.slice(0, 2) : [getVibeLabel(recipe.vibe || "comfort")];
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

  useEffect(() => {
    setIsHeroImageLoaded(false);
    setHasHeroImageError(false);
  }, [heroImage]);

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
                  setHasHeroImageError(true);
                  setIsHeroImageLoaded(false);
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

            <div className="relative z-10 flex min-h-[380px] flex-col justify-end p-6 sm:min-h-[420px] sm:p-8">
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

                <div className="flex flex-nowrap items-center gap-2.5 overflow-x-auto pb-1">
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
                </div>
              </div>
            </div>
          </div>
        </section>

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
