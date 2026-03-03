import { SYSTEM_PROMPTS, USER_PROMPT_TEMPLATES } from "@/lib/prompts";
import {
  getMealTypeLabel,
  normalizeMealTypePreference,
  type MealTypePreference,
} from "@/lib/meal-type";

type CookingTimePreset = "quick" | "medium" | "long";

type BuildRecipeGenerationPromptsParams = {
  ingredients: unknown[];
  servings: unknown;
  cookingTime: unknown;
  vibe: unknown;
  cuisine: unknown;
  mealType: unknown;
  language: string;
};

type BuildRecipeGenerationPromptsResult = {
  systemPrompt: string;
  userPrompt: string;
  mealTypePreference: MealTypePreference;
};

function normalizeCookingTimePreset(value: unknown): CookingTimePreset {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "quick" || raw === "medium" || raw === "long") {
    return raw;
  }
  return "medium";
}

function getCookingTimeRange(preset: CookingTimePreset): { min: number; max: number } {
  switch (preset) {
    case "quick":
      return { min: 10, max: 25 };
    case "long":
      return { min: 60, max: 120 };
    case "medium":
    default:
      return { min: 30, max: 60 };
  }
}

function isChineseLanguage(language: string): boolean {
  return language === "zh" || language === "zh-CN";
}

export function buildRecipeGenerationPrompts({
  ingredients,
  servings,
  cookingTime,
  vibe,
  cuisine,
  mealType,
  language,
}: BuildRecipeGenerationPromptsParams): BuildRecipeGenerationPromptsResult {
  const ingredientNames = ingredients.map((ingredient: any) => ingredient.name);
  const cookingTimePreset = normalizeCookingTimePreset(cookingTime);
  const cookingTimeRange = getCookingTimeRange(cookingTimePreset);
  const cookingTimeRangeLabel = `${cookingTimeRange.min}-${cookingTimeRange.max}`;
  const vibeLabel = String(vibe ?? "");
  const cuisineLabel = String(cuisine ?? "").trim() || "any";
  const mealTypePreference = normalizeMealTypePreference(mealType);
  const zhLanguage = isChineseLanguage(language);
  const mealTypeLabel =
    mealTypePreference === "any"
      ? zhLanguage
        ? "任意"
        : "any"
      : getMealTypeLabel(mealTypePreference, language);

  if (zhLanguage) {
    return {
      systemPrompt: SYSTEM_PROMPTS.CHINESE,
      userPrompt: `${USER_PROMPT_TEMPLATES.CHINESE(
        ingredientNames,
        Number(servings),
        cookingTimePreset,
        cookingTimeRangeLabel,
        vibeLabel,
        cuisineLabel
      )}\n\n餐次类型：${mealTypeLabel}\n请在每个菜谱中返回 meal_type 字段，值只能是 breakfast/lunch/dinner/snack/dessert。\n只返回原始 JSON，不要 markdown 代码块，不要解释说明。`,
      mealTypePreference,
    };
  }

  return {
    systemPrompt: SYSTEM_PROMPTS.DEFAULT,
    userPrompt: `${USER_PROMPT_TEMPLATES.ENGLISH(
      ingredientNames,
      Number(servings),
      cookingTimePreset,
      cookingTimeRangeLabel,
      vibeLabel,
      cuisineLabel
    )}\n\nMeal type preference: ${mealTypeLabel}\nReturn a meal_type field for each recipe, and the value must be one of breakfast/lunch/dinner/snack/dessert.\nReturn ONLY raw JSON. No markdown code fences and no explanatory text.`,
    mealTypePreference,
  };
}

