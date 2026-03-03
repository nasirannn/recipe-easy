// ==================== 核心类型定义 ====================

import React from 'react';
import type { MealType, MealTypePreference } from '@/lib/meal-type';
import type { RecipeVibe } from '@/lib/vibe';

// 基础实体类型
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// ==================== 用户相关类型 ====================

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
}

export type UserLoginStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface UserCredits extends BaseEntity {
  user_id: string;
  credits: number;
  total_earned: number;
  total_spent: number;
}

export interface CreditTransaction extends BaseEntity {
  user_id: string;
  type: 'earn' | 'spend';
  amount: number;
}

// ==================== 食材和分类类型 ====================

export interface IngredientCategory {
  id: number;
  slug: string;
  name: string;
  sort_order?: number;
}

export interface Ingredient {
  id: number | string;
  slug?: string;
  name: string;
  englishName?: string;
  category?: IngredientCategory;
  isCustom?: boolean;
}

export interface Cuisine {
  id: number;
  name: string;
  slug: string;
}

// ==================== 食谱相关类型 ====================

export interface RecipeNutrition {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
}

export interface RecipePairing {
  type: string | null;
  name: string | null;
  note: string | null;
  description: string | null;
}

export interface Recipe extends BaseEntity {
  title: string;
  description: string;
  cookingTime: number;
  servings: number;
  vibe: RecipeVibe;
  mealType?: MealType | null;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  tags: string[];
  chefTips: string[];
  userId?: string;
  cuisineId?: number;
  cuisineName?: string; // 菜系名称
  cuisine?: Cuisine; // 菜系对象
  imagePath?: string;
  imageModel?: string;
  languageModel?: string;
  language?: string;
  recommended?: boolean;
  authorName?: string;
  authorAvatarUrl?: string;
  pairing?: RecipePairing;
  nutrition?: RecipeNutrition;
}

// 数据库食谱类型（用于API响应）
export interface DatabaseRecipe {
  id: string;
  title: string;
  imagePath: string | null;
  description: string | null;
  tags: string | null;
  cookingTime: number | null;
  servings: number | null;
  vibe: string | null;
  mealType?: MealType | null;
  ingredients: string;
  seasoning: string | null;
  instructions: string;
  chefTips: string | null;
  cuisineId: number | null;
  cuisineName?: string | null;
  userId: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  pairingType?: string | null;
  pairingName?: string | null;
  pairingNote?: string | null;
  pairingDescription?: string | null;
  imageModel?: string | null;
  languageModel?: string | null;
  language: string;
  proteinG?: number | null;
  carbohydratesG?: number | null;
  fatG?: number | null;
  fiberG?: number | null;
  sugarG?: number | null;
  caloriesKcal?: number | null;
  createdAt: string;
  updatedAt: string;
}

// 食谱创建和更新输入类型
export interface RecipeInput {
  title: string;
  imagePath?: string;
  description?: string;
  tags?: string[];
  cookingTime?: number;
  servings?: number;
  vibe?: RecipeVibe | string;
  mealType?: MealType | null;
  ingredients: any[] | string;
  seasoning?: any[] | string;
  instructions: any[] | string;
  chefTips?: string;
  cuisineId?: number;
  userId?: string;
  language?: string;
  nutrition?: Partial<RecipeNutrition>;
}

// 食谱表单数据
export interface RecipeFormData {
  ingredients: Ingredient[];
  servings: number;
  recipeCount: number;
  cookingTime: 'quick' | 'medium' | 'long';
  vibe: 'quick' | 'gourmet' | 'comfort' | 'healthy';
  mealType: MealTypePreference;
  cuisine: string;
  languageModel: LanguageModel;
  imageModel: ImageModel;
}

// ==================== AI模型类型 ====================

export type LanguageModel = 'QWENPLUS' | 'GPT4o_MINI';
export type ImageModel = 'wanx' | 'flux';
export type ImageSize = '1024x1024' | '1024*1024';
export type ImageStyle = 'photographic' | '<photography>';

// 模型配置
export interface ModelConfig {
  model: string;
  baseUrl: string;
  apiKey: string | undefined;
  maxTokens?: number;
  temperature?: number;
  supportsJsonFormat?: boolean;
  style?: string;
  size?: string;
  maxImages?: number;
  negativePrompt?: string;
  timeout?: number;
  maxAttempts?: number;
  fallback?: ModelConfig;
}

// ==================== API相关类型 ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  limit: number;
  offset: number;
  results?: T[];
}

// 生成请求类型
export interface GenerationRequest {
  ingredients: string[];
  servings: number;
  cookingTime: string;
  vibe: string;
  mealType?: MealTypePreference;
  cuisine: string;
  language: string;
  languageModel?: string;
  userId?: string;
}

export interface ImageGenerationRequest {
  recipeId: string;
  description: string;
  language: string;
  imageModel: ImageModel;
  userId?: string;
}

export interface ImageGenParams {
  prompt: string;
  style?: ImageStyle;
  negativePrompt?: string;
  size?: ImageSize;
  n?: number;
  model?: ImageModel;
  userId?: string;
  language?: string;
}

export type ImageGenResponse = {
  success: boolean;
  imagePath?: string;
  images?: string[];
  error?: string;
  taskId?: string;
  status?: string;
};

// ==================== 环境配置类型 ====================

export interface DatabaseEnv {
  DATABASE_URL?: string;
  R2_ENDPOINT?: string;
  R2_BUCKET_NAME_IMG?: string;
  R2_PUBLIC_URL_IMG?: string;
  R2_BUCKET_NAME_DOC?: string;
  R2_PUBLIC_URL_DOC?: string;
}

export type SupportedLocale = 'en' | 'zh';

// ==================== 组件Props类型 ====================

export interface RecipeDisplayProps {
  recipes: Recipe[];
  loading: boolean;
  onRegenerateRecipe: (ingredients: Ingredient[], recipe: Recipe) => void;
  onGenerateImage: (recipeId: string, recipe: Recipe) => void;
  onRegenerateImage: (recipeId: string, recipe: Recipe) => void;
  onSaveRecipe: (recipe: Recipe) => void;
  imageGenerating: boolean;
  imageLoadingStates: Record<string, boolean>;
}

export interface RecipeFormProps {
  onSubmit: (data: RecipeFormData) => void;
  loading: boolean;
  onChange: (data: RecipeFormData) => void;
  initialData?: Partial<RecipeFormData>;
}

// ==================== Hook返回类型 ====================

export interface UseRecipeGenerationReturn {
  loading: boolean;
  recipes: Recipe[];
  error: string | null;
  generateRecipe: (formData: RecipeFormData) => Promise<Recipe[]>;
  regenerateRecipe: (ingredients: Ingredient[], recipe: Recipe, formData: RecipeFormData) => Promise<Recipe[]>;
  clearRecipes: () => void;
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

export interface UseImageGenerationReturn {
  imageGenerating: boolean;
  imageLoadingStates: Record<string, boolean>;
  generateImage: (recipeId: string, recipe: Recipe, imageModel: ImageModel, onSuccess: (imageUrl: string) => void) => Promise<void>;
  regenerateImage: (recipeId: string, recipe: Recipe, imageModel: ImageModel, onSuccess: (imageUrl: string) => void) => Promise<void>;
  clearImageLoadingStates: () => void;
  generateImagesForRecipes?: (recipes: Recipe[], imageModel: ImageModel, onRecipeImageGenerated: (recipeId: string, imageUrl: string) => void) => Promise<void>;
}

export interface UseRecipeSaveReturn {
  saveRecipe: (recipe: Recipe) => Promise<void>;
}

// ==================== 错误类型 ====================

export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ==================== 工具类型 ====================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ==================== 类型验证函数 ====================

export function isValidRecipe(obj: any): obj is Recipe {
  return obj && 
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    Array.isArray(obj.ingredients) &&
    Array.isArray(obj.instructions);
}

export function isValidIngredient(obj: any): obj is Ingredient {
  return obj && 
    typeof obj.name === 'string' &&
    (typeof obj.id === 'string' || typeof obj.id === 'number');
}
