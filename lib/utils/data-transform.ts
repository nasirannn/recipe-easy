/**
 * 数据转换工具
 * 处理菜谱数据在API和数据库之间的格式转换
 */

/**
 * 将菜谱数据标准化为数据库格式
 */
export function normalizeRecipeForDatabase(recipe: any): any {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    cooking_time: recipe.cookingTime || recipe.cooking_time, // 优先使用驼峰格式
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients,
    seasoning: recipe.seasoning,
    instructions: recipe.instructions,
    tags: recipe.tags,
    chef_tips: recipe.chefTips || recipe.chef_tips, // 优先使用驼峰格式
    cuisineId: recipe.cuisineId || recipe.cuisine_id, // 优先使用驼峰格式
    language: recipe.language // 添加语言字段
  };
}

/**
 * 将数据库菜谱数据转换为API格式
 */
export function normalizeRecipeForAPI(recipe: any): any {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    cookingTime: recipe.cooking_time || recipe.cookingTime, // 统一返回驼峰格式
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : JSON.parse(recipe.ingredients || '[]'),
    seasoning: Array.isArray(recipe.seasoning) ? recipe.seasoning : JSON.parse(recipe.seasoning || '[]'),
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions : JSON.parse(recipe.instructions || '[]'),
    tags: Array.isArray(recipe.tags) ? recipe.tags : JSON.parse(recipe.tags || '[]'),
    chefTips: Array.isArray(recipe.chef_tips) ? recipe.chef_tips : JSON.parse(recipe.chef_tips || '[]'), // 统一返回驼峰格式
    cuisineId: recipe.cuisine_id || recipe.cuisineId // 统一返回驼峰格式
  };
}

/**
 * 菜系ID到slug的映射
 */
export const CUISINE_SLUG_MAP: Record<number, string> = {
  1: 'chinese',
  2: 'italian', 
  3: 'french',
  4: 'indian',
  5: 'japanese',
  6: 'mediterranean',
  7: 'thai',
  8: 'mexican',
  9: 'others'
};

/**
 * 分类ID到slug的映射
 */
export const CATEGORY_SLUG_MAP: Record<number, string> = {
  1: 'meat',
  2: 'seafood', 
  3: 'vegetables',
  4: 'fruits',
  5: 'dairy-eggs',
  6: 'grains-bread',
  7: 'nuts-seeds',
  8: 'herbs-spices'
};

/**
 * 格式化菜系数据
 */
export function formatCuisine(cuisine: any): any {
  return {
    id: cuisine.id,
    name: cuisine.cuisine_name,
    slug: cuisine.cuisine_slug,
    cssClass: cuisine.css_class
  };
}

/**
 * 格式化分类数据
 */
export function formatCategory(category: any): any {
  return {
    id: category.id,
    slug: CATEGORY_SLUG_MAP[category.id] || `category-${category.id}`,
    name: category.category_name || `Category ${category.id}`,
    sort_order: category.id
  };
}

/**
 * 格式化食材数据
 */
export function formatIngredient(ingredient: any): any {
  return {
    id: ingredient.id,
    slug: ingredient.slug || `ingredient-${ingredient.id}`,
    name: ingredient.ingredient_name || `Ingredient ${ingredient.id}`,
    englishName: ingredient.ingredient_name || `Ingredient ${ingredient.id}`,
    category: {
      id: ingredient.category_id || 1,
      slug: CATEGORY_SLUG_MAP[ingredient.category_id] || 'other',
      name: ingredient.category_name || 'Other'
    }
  };
}

/**
 * 格式化菜谱数据（包含图片信息）
 */
export function formatRecipeWithImage(
  recipe: any, 
  imagePath: string | null,
  baseUrl: string
): any {
  return {
    id: recipe.id,
    title: recipe.localized_title || recipe.title || `Recipe ${recipe.id}`,
    description: recipe.localized_description || recipe.description || `Description for Recipe ${recipe.id}`,
    imagePath: imagePath ? `${baseUrl}/images/${imagePath}` : null,
    ingredients: recipe.localized_ingredients || recipe.ingredients || [],
    seasoning: recipe.localized_seasoning || recipe.seasoning || [],
    instructions: recipe.localized_instructions || recipe.instructions || [],
    chefTips: recipe.localized_chef_tips || recipe.chef_tips || [],
    tags: recipe.localized_tags || recipe.tags || [],
    difficulty: recipe.localized_difficulty || recipe.difficulty || 'easy',
    cookingTime: recipe.cooking_time || 30, // 统一返回驼峰格式
    servings: recipe.servings || 4,
    user_id: recipe.user_id, // 添加用户ID
    cuisine: {
      id: recipe.cuisine_id || 1,
      slug: CUISINE_SLUG_MAP[Number(recipe.cuisine_id)] || 'other',
      name: recipe.localized_cuisine_name || recipe.cuisine_name || 'Other',
      cssClass: recipe.css_class || 'cuisine-other'
    },
    created_at: recipe.created_at,
    updated_at: recipe.updated_at
  };
}

/**
 * 安全解析JSON字符串
 */
export function safeJsonParse(value: any, defaultValue: any = []): any {
  if (Array.isArray(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }
  
  return defaultValue;
}

/**
 * 验证和清理用户输入
 */
export function sanitizeUserInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeUserInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(input)) {
      cleaned[key] = sanitizeUserInput(value);
    }
    return cleaned;
  }
  
  return input;
} 