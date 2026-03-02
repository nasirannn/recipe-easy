import {
  ChefHat,
  Clock,
  FlaskConical,
  Leaf,
  Lightbulb,
  RefreshCw,
  Tag,
  Users,
  X,
  ListOrdered,
} from "lucide-react";
import { Recipe } from "@/lib/types";
import { APP_CONFIG, getImageUrl } from "@/lib/config";
import { useState } from "react";
import { Button } from "./button";
import Image from "next/image";
import { Dialog, DialogContent } from "./dialog";
import { useTranslations, useLocale } from "next-intl";
import { useUserUsage } from "@/hooks/use-user-usage";
import { Card, CardContent } from "./card";
import { normalizeRecipeVibe } from "@/lib/vibe";

interface RecipeDisplayProps {
  recipes: Recipe[];
  imageLoadingStates?: Record<string, boolean>;
  onRegenerateImage?: (recipeId: string, recipe: Recipe) => void;
}

const sectionCardClass = "home-card border-border-70 bg-card-90";
const sectionTitleClass =
  "flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground md:text-xl";

export const RecipeDisplay = ({
  recipes,
  imageLoadingStates = {},
  onRegenerateImage,
}: RecipeDisplayProps) => {
  const t = useTranslations("recipeDisplay");
  const tRecipeForm = useTranslations("recipeForm");
  const locale = useLocale();
  const { credits } = useUserUsage();
  const canGenerateImage = (credits?.credits ?? 0) >= APP_CONFIG.imageGenerationCost;

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getVibeLabel = (vibe: string) => {
    switch (normalizeRecipeVibe(vibe, "comfort")) {
      case "quick":
        return t("quick");
      case "gourmet":
        return t("gourmet");
      case "healthy":
        return t("healthy");
      case "comfort":
      default:
        return t("comfort");
    }
  };

  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
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

  return (
    <div className="recipe-display-container">
      <div className="space-y-10 md:space-y-12">
        {recipes.map((recipe, index) => {
          const ingredients = parseJsonArray(recipe.ingredients);
          const seasoning = parseJsonArray(recipe.seasoning);
          const instructions = parseJsonArray(recipe.instructions);
          const chefTips = parseJsonArray(recipe.chefTips);
          const tags = parseJsonArray(recipe.tags);

          return (
            <div
              key={recipe.id || `recipe-${index}`}
              className="grid grid-cols-1 gap-6"
            >
              <div className="space-y-6">
                <div className="home-card relative aspect-[4/3] overflow-hidden">
                  {recipe.imagePath && !imageErrors[recipe.id] ? (
                    <>
                      <Image
                        src={getImageUrl(recipe.imagePath)}
                        alt={recipe.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="cursor-pointer object-cover transition duration-300 hover:scale-[1.02]"
                        unoptimized={true}
                        onClick={() => openImageDialog(getImageUrl(recipe.imagePath!))}
                        onError={() => {
                          setImageErrors((prev) => ({ ...prev, [recipe.id]: true }));
                        }}
                      />

                      {imageLoadingStates[recipe.id] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                          <div className="rounded-full bg-background p-4 shadow-xl">
                            <RefreshCw className="h-8 w-8 animate-spin text-foreground" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Image
                        src="/images/recipe-placeholder-bg.png"
                        alt="Recipe placeholder"
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            if (onRegenerateImage) {
                              onRegenerateImage(recipe.id, recipe);
                            }
                          }}
                          className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background shadow-xl transition hover:scale-105 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                          disabled={imageLoadingStates[recipe.id]}
                        >
                          <RefreshCw
                            className={`h-8 w-8 text-foreground ${
                              imageLoadingStates[recipe.id] ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-1/2 max-w-[85%] -translate-x-1/2 rounded-md bg-black/80 px-3 py-1.5 text-center text-xs font-medium text-white">
                        {tRecipeForm("generateImageCost")}
                      </div>
                    </>
                  )}

                  {onRegenerateImage &&
                    recipe.imagePath &&
                    !imageErrors[recipe.id] &&
                    !imageLoadingStates[recipe.id] && (
                      <button
                        className={`absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2 ${
                          canGenerateImage
                            ? "border-border bg-background text-foreground hover:bg-muted"
                            : "cursor-not-allowed border-border-70 bg-muted text-muted-foreground"
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (canGenerateImage) {
                            onRegenerateImage(recipe.id, recipe);
                          }
                        }}
                        title={
                          !canGenerateImage
                            ? locale === "zh"
                              ? "积分不足，无法重新生成图片"
                              : "Insufficient credits to regenerate image"
                            : locale === "zh"
                            ? `重新生成图片需消耗${APP_CONFIG.imageGenerationCost}积分`
                            : `Regenerate image costs ${APP_CONFIG.imageGenerationCost} credits`
                        }
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                    )}
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                    {recipe.title}
                  </h2>
                  <p className="text-sm leading-7 text-muted-foreground sm:text-base md:text-lg">
                    {recipe.description}
                  </p>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {tags.map((tag, tagIndex) => (
                        <span
                          key={`${recipe.id}-tag-${tagIndex}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border-80 bg-background-80 px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          <Tag className="h-3.5 w-3.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Card className={sectionCardClass}>
                  <CardContent className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-3">
                    {recipe.cookingTime && (
                      <div className="rounded-xl border border-border-70 bg-background-70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <p className="text-xs font-semibold uppercase tracking-wide">
                            {t("cookTime")}
                          </p>
                        </div>
                        <p className="text-base font-semibold text-foreground md:text-lg">
                          {recipe.cookingTime} {t("mins")}
                        </p>
                      </div>
                    )}

                    {recipe.servings && (
                      <div className="rounded-xl border border-border-70 bg-background-70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <p className="text-xs font-semibold uppercase tracking-wide">
                            {t("serves")}
                          </p>
                        </div>
                        <p className="text-base font-semibold text-foreground md:text-lg">
                          {recipe.servings}
                        </p>
                      </div>
                    )}

                    {recipe.vibe && (
                      <div className="rounded-xl border border-border-70 bg-background-70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                          <ChefHat className="h-4 w-4" />
                          <p className="text-xs font-semibold uppercase tracking-wide">
                            {t("vibe")}
                          </p>
                        </div>
                        <p className="text-base font-semibold text-foreground md:text-lg">
                          {getVibeLabel(recipe.vibe)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {ingredients.length > 0 && (
                    <Card className={sectionCardClass}>
                      <CardContent className="p-4 sm:p-5">
                        <h3 className={sectionTitleClass}>
                          <Leaf className="h-5 w-5 text-primary" />
                          {t("ingredients")}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                          {ingredients.map((ingredient, ingredientIndex) => (
                            <li
                              key={`${recipe.id}-ingredient-${ingredientIndex}`}
                              className="flex items-start gap-2.5 text-sm text-muted-foreground md:text-base"
                            >
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                              <span>{ingredient}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {seasoning.length > 0 && (
                    <Card className={sectionCardClass}>
                      <CardContent className="p-4 sm:p-5">
                        <h3 className={sectionTitleClass}>
                          <FlaskConical className="h-5 w-5 text-primary" />
                          {t("seasoning")}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                          {seasoning.map((season, seasoningIndex) => (
                            <li
                              key={`${recipe.id}-seasoning-${seasoningIndex}`}
                              className="flex items-start gap-2.5 text-sm text-muted-foreground md:text-base"
                            >
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                              <span>{season}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {instructions.length > 0 && (
                  <Card className={sectionCardClass}>
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <h3 className={sectionTitleClass}>
                        <ListOrdered className="h-5 w-5 text-primary" />
                        {t("instructions")}
                      </h3>
                      <div className="mt-5 space-y-4">
                        {instructions.map((step, stepIndex) => (
                          <div
                            key={`${recipe.id}-instruction-${stepIndex}`}
                            className="flex gap-3"
                          >
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                              {stepIndex + 1}
                            </div>
                            <p className="text-sm leading-7 text-muted-foreground md:text-base">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {chefTips.length > 0 && (
                  <Card className={sectionCardClass}>
                    <CardContent className="p-4 sm:p-5">
                      <h3 className={sectionTitleClass}>
                        <Lightbulb className="h-5 w-5 text-primary" />
                        {t("chefTips")}
                      </h3>
                      <div className="mt-4 space-y-2.5">
                        {chefTips.map((tip, tipIndex) => (
                          <div
                            key={`${recipe.id}-tip-${tipIndex}`}
                            className="flex items-start gap-2.5"
                          >
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                            <p className="text-sm leading-7 text-muted-foreground md:text-base">
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 border-t border-border-80 pt-3">
                        <p className="text-xs italic text-muted-foreground">
                          {t("aiContentNotice")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

            </div>
          );
        })}
      </div>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <div className="relative">
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Recipe"
                width={800}
                height={600}
                className="h-auto w-full rounded-lg shadow-2xl"
                unoptimized={true}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/20 p-0 backdrop-blur-sm hover:bg-white/30"
              onClick={() => setImageDialogOpen(false)}
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
