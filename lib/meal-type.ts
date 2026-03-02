export const MEAL_TYPE_OPTIONS = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const;

export type MealType = (typeof MEAL_TYPE_OPTIONS)[number];
export type MealTypePreference = MealType | 'any';

const MEAL_TYPE_SET = new Set<string>(MEAL_TYPE_OPTIONS);

const ZH_KEYWORD_MAP: Array<{ keywords: string[]; mealType: MealType }> = [
  { keywords: ['早餐', '早饭', '早午餐', '早点'], mealType: 'breakfast' },
  { keywords: ['午餐', '中饭', '中餐'], mealType: 'lunch' },
  { keywords: ['晚餐', '晚饭', '夜宵'], mealType: 'dinner' },
  { keywords: ['零食', '小吃', '点心'], mealType: 'snack' },
  { keywords: ['甜品', '甜点', '甜食'], mealType: 'dessert' },
];

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z-]/g, '');
}

function mapMealTypeToken(token: string): MealType | null {
  if (!token) {
    return null;
  }

  if (MEAL_TYPE_SET.has(token)) {
    return token as MealType;
  }

  if (token.includes('breakfast') || token.includes('brunch') || token.includes('morning')) {
    return 'breakfast';
  }
  if (token.includes('lunch') || token.includes('midday') || token.includes('noon')) {
    return 'lunch';
  }
  if (token.includes('dinner') || token.includes('supper') || token.includes('evening')) {
    return 'dinner';
  }
  if (
    token.includes('snack') ||
    token.includes('appetizer') ||
    token.includes('starter') ||
    token.includes('finger-food')
  ) {
    return 'snack';
  }
  if (
    token.includes('dessert') ||
    token.includes('sweet') ||
    token.includes('pastry') ||
    token.includes('cake')
  ) {
    return 'dessert';
  }

  return null;
}

function mapChineseMealType(raw: string): MealType | null {
  for (const entry of ZH_KEYWORD_MAP) {
    if (entry.keywords.some((keyword) => raw.includes(keyword))) {
      return entry.mealType;
    }
  }
  return null;
}

export function normalizeMealType(
  value: unknown,
  fallback: MealType | null = null
): MealType | null {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  const zhMapped = mapChineseMealType(trimmed);
  if (zhMapped) {
    return zhMapped;
  }

  const token = normalizeToken(trimmed);
  const mapped = mapMealTypeToken(token);
  return mapped ?? fallback;
}

export function normalizeMealTypePreference(value: unknown): MealTypePreference {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'any' || normalized === 'all' || normalized === 'random') {
      return 'any';
    }
  }

  const mealType = normalizeMealType(value, null);
  return mealType ?? 'any';
}

export function resolveMealType(
  requestedPreference: MealTypePreference,
  inferredRaw: unknown
): MealType | null {
  const requestedMealType =
    requestedPreference === 'any' ? null : normalizeMealType(requestedPreference, null);

  if (requestedMealType) {
    return requestedMealType;
  }

  return normalizeMealType(inferredRaw, null);
}

export function getMealTypeLabel(mealType: MealType, locale?: string): string {
  const isZh = (locale ?? '').toLowerCase().startsWith('zh');

  if (isZh) {
    switch (mealType) {
      case 'breakfast':
        return '早餐';
      case 'lunch':
        return '午餐';
      case 'dinner':
        return '晚餐';
      case 'snack':
        return '零食';
      case 'dessert':
        return '甜品';
      default:
        return '其他';
    }
  }

  switch (mealType) {
    case 'breakfast':
      return 'Breakfast';
    case 'lunch':
      return 'Lunch';
    case 'dinner':
      return 'Dinner';
    case 'snack':
      return 'Snack';
    case 'dessert':
      return 'Dessert';
    default:
      return 'Other';
  }
}
