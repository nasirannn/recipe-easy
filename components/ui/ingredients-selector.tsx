import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Box, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Ingredient } from "@/lib/types";

const CATEGORY_KEYS = [
  "meat",
  "seafood",
  "vegetables",
  "fruits",
  "dairy-eggs",
  "grains-bread",
  "nuts-seeds",
  "herbs-spices",
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

type CategoryMap = Record<string, Ingredient[]>;

interface IngredientSelectorProps {
  selectedIngredients: Ingredient[];
  onIngredientSelect: (ingredient: Ingredient, sourceRect?: DOMRect) => void;
  onIngredientRemove?: (ingredient: Ingredient) => void;
  activeCategory?: CategoryKey;
  onCategoryChange?: (categoryId: CategoryKey) => void;
  allIngredients: Ingredient[];
  dynamicCategories: Record<string, { name: string; icon?: string; color?: string }>;
  hideHeader?: boolean;
}

export const IngredientSelector = ({
  selectedIngredients,
  onIngredientSelect,
  activeCategory: externalActiveCategory,
  allIngredients,
  dynamicCategories,
  hideHeader = false,
}: IngredientSelectorProps) => {
  const t = useTranslations("ingredientSelector");
  const [internalActiveCategory] = useState<CategoryKey>("meat");
  const [categorizedIngredients, setCategorizedIngredients] = useState<CategoryMap>({});

  const activeCategory = externalActiveCategory || internalActiveCategory;

  useEffect(() => {
    const groupedByCategory: CategoryMap = {
      all: allIngredients,
      other: [],
      meat: [],
      seafood: [],
      vegetables: [],
      fruits: [],
      "dairy-eggs": [],
      "grains-bread": [],
      "nuts-seeds": [],
      "herbs-spices": [],
    };

    for (const ingredient of allIngredients) {
      const category = ingredient.category?.slug;
      if (category && groupedByCategory[category]) {
        groupedByCategory[category].push(ingredient);
      } else {
        groupedByCategory.other.push(ingredient);
      }
    }

    setCategorizedIngredients(groupedByCategory);
  }, [allIngredients]);

  const filteredIngredients = useMemo(() => {
    const categoryIngredients = categorizedIngredients[activeCategory] || [];

    return categoryIngredients.filter((ingredient) => {
      if (!ingredient?.id || !ingredient?.name) {
        return false;
      }

      const isAlreadySelected = selectedIngredients.some((selected) => selected.id === ingredient.id);
      if (isAlreadySelected) {
        return false;
      }
      return true;
    });
  }, [activeCategory, categorizedIngredients, selectedIngredients]);

  const activeCategoryName =
    dynamicCategories[activeCategory]?.name || t(`categories.${activeCategory}`);

  return (
    <div className="flex h-full w-full flex-col">
      {!hideHeader && (
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="truncate text-xs font-semibold tracking-wide text-muted-foreground">
            {activeCategoryName}
          </p>
          <span className="text-xs text-muted-foreground">
            {filteredIngredients.length} {t("items")}
          </span>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <div className="scrollbar-hide h-full w-full overflow-y-auto">
          {filteredIngredients.length > 0 ? (
            <div className={cn(
              "flex flex-wrap items-start gap-2.5 pr-2",
              hideHeader ? "pb-1.5 pl-1.5 pt-0" : "p-1.5"
            )}>
              {filteredIngredients.map((ingredient) => {
                const iconPath = ingredient.slug
                  ? `/images/ingredients-icon/${ingredient.slug}.svg`
                  : null;

                return (
                  <button
                    key={ingredient.id}
                    type="button"
                    onClick={(event) => {
                      const sourceRect = event.currentTarget.getBoundingClientRect();
                      onIngredientSelect(ingredient, sourceRect);
                    }}
                    className={cn(
                      "ingredient-option group inline-flex min-h-[116px] w-[92px] shrink-0 flex-col items-center justify-start gap-2 rounded-xl border border-border-65 bg-card-95 px-2.5 py-2.5 text-center shadow-sm transition-[background-color,border-color,box-shadow] duration-200",
                      "hover:border-primary/35 hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2"
                    )}
                  >
                    {iconPath ? (
                      <Image
                        src={iconPath}
                        alt={ingredient.name}
                        width={44}
                        height={44}
                        className="ingredient-option-icon h-11 w-11 shrink-0 object-contain"
                        onError={(event) => {
                          const target = event.currentTarget;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="ingredient-option-icon flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                        <Box className="h-5 w-5 text-muted-foreground" />
                      </span>
                    )}
                    <span className="line-clamp-2 text-xs font-medium leading-4 text-foreground">
                      {ingredient.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-3">
              <div className="w-full max-w-sm rounded-xl border border-dashed border-border-80 bg-background-50 px-4 py-6 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  {allIngredients.length > 0 ? (
                    <SearchX className="h-[18px] w-[18px] text-muted-foreground" />
                  ) : (
                    <Box className="h-[18px] w-[18px] text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {allIngredients.length > 0
                    ? t("noIngredientsInCategory")
                    : t("loadingIngredients")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("tryOtherCategoryOrSearch")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
