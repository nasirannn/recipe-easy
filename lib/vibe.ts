export const RECIPE_VIBES = ['quick', 'comfort', 'gourmet', 'healthy'] as const;

export type RecipeVibe = (typeof RECIPE_VIBES)[number];

const QUICK_TOKENS = ['quick', 'easy', 'fast', 'simple', '简单', '快手', '快速'];
const COMFORT_TOKENS = ['comfort', 'medium', 'homestyle', 'cozy', '中等', '家常'];
const GOURMET_TOKENS = ['gourmet', 'hard', 'complex', 'chef', '困难', '精致'];
const HEALTHY_TOKENS = ['healthy', 'light', 'clean', 'wellness', '健康', '清淡'];

function includesAnyToken(value: string, tokens: string[]): boolean {
  return tokens.some((token) => value === token || value.includes(token));
}

export function normalizeRecipeVibe(
  value: unknown,
  fallback: RecipeVibe = 'comfort'
): RecipeVibe {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (includesAnyToken(normalized, QUICK_TOKENS)) {
    return 'quick';
  }
  if (includesAnyToken(normalized, GOURMET_TOKENS)) {
    return 'gourmet';
  }
  if (includesAnyToken(normalized, HEALTHY_TOKENS)) {
    return 'healthy';
  }
  if (includesAnyToken(normalized, COMFORT_TOKENS)) {
    return 'comfort';
  }

  if ((RECIPE_VIBES as readonly string[]).includes(normalized)) {
    return normalized as RecipeVibe;
  }

  return fallback;
}

