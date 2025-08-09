// ==================== 核心类型定义 ====================

import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import React from 'react';

// 基础数据库实体类型
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

export interface UserStatus {
  isLoggedIn: boolean;
  credits: number;
  totalEarned: number;
  totalSpent: number;
}

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
  reason: string;
  description?: string;
}

// ==================== 食材和分类类型 ====================

export interface IngredientCategory {
  id: number;
  slug: string;
  name: string;
  sort_order?: number;
}

export interface Ingredient {
  id: number;
  slug: string;
  name: string;
  englishName?: string;
  category: IngredientCategory;
}

export interface CustomIngredient {
  id: number | string;
  name: string;
  category: IngredientCategory;
}

export interface Cuisine {
  id: number;
  name: string;
  slug: string;
}

// ==================== 食谱相关类型 ====================

export interface Recipe extends BaseEntity {
  title: string;
  description: string;
  cookingTime: number;
  cooking_time?: number; // 兼容数据库字段名
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  tags: string[];
  chefTips: string[];
  chef_tips?: string[]; // 兼容数据库字段名
  user_id?: string;
  cuisine_id?: number;
  cuisineId?: number; // 兼容前端使用
  imagePath?: string;
  imageModel?: string;
  languageModel?: string;
  language?: string;
  recommended?: boolean;
}

export interface DatabaseRecipe {
  id: string;
  title: string;
  description: string;
  cooking_time: number;
  servings: number;
  difficulty: string;
  ingredients: string;
  seasoning: string;
  instructions: string;
  tags: string;
  chef_tips: string;
  user_id: string;
  cuisine_id: number;
  image_path?: string;
  image_model?: string;
  language_model?: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateRecipeInput {
  title?: string;
  description?: string;
  cooking_time?: number;
  servings?: number;
  difficulty?: string;
  ingredients?: string[];
  seasoning?: string[];
  instructions?: string[];
  tags?: string[];
  chef_tips?: string[];
  cuisine_id?: number;
  language?: string;
}

export interface RecipeImage extends BaseEntity {
  user_id: string;
  recipe_id: string;
  image_path: string;
  expires_at: string;
  image_model: string;
}

// ==================== 表单和UI类型 ====================

export interface RecipeFormData {
  ingredients: Ingredient[];
  servings: number;
  recipeCount: number;
  cookingTime: 'quick' | 'medium' | 'long';
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  languageModel: LanguageModel;
  imageModel: ImageModel;
}

// ==================== AI模型类型 ====================

export type LanguageModel = 'QWENPLUS' | 'GPT4o_MINI' | 'DEEPSEEK';
export type ImageModel = 'wanx' | 'flux';
export type ImageSize = '1024x1024' | '1024*1024';
export type ImageStyle = 'photographic' | '<photography>';

export interface LanguageModelConfig {
  model: string;
  baseUrl: string;
  apiKey: string | undefined;
  maxTokens: number;
  temperature: number;
  supportsJsonFormat: boolean;
  fallback?: LanguageModelConfig;
}

export interface ImageModelConfig {
  model: string;
  baseUrl: string;
  apiKey: string | undefined;
  style: string;
  size: string;
  maxImages: number;
  negativePrompt: string;
  timeout: number;
  maxAttempts: number;
}

export interface LanguageConfigSet {
  language: LanguageModelConfig;
  image: ImageModelConfig;
}

// ==================== API响应类型 ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  limit: number;
  offset: number;
  results?: T[];
}

// ==================== 系统配置类型 ====================

export interface SystemConfig extends BaseEntity {
  key: string;
  value: string;
}

export interface ModelUsageRecord extends BaseEntity {
  model_name: string;
  model_type: 'language' | 'image';
  request_details?: string;
}

// ==================== 生成相关类型 ====================

export interface GenerationRequest {
  ingredients: string[];
  servings: number;
  cookingTime: string;
  difficulty: string;
  cuisine: string;
  language: string;
  languageModel?: string;
  userId?: string;
  isAdmin?: boolean;
}

export interface ImageGenerationRequest {
  recipeId: string;
  description: string;
  language: string;
  imageModel: ImageModel;
  userId?: string;
}

// ==================== 数据库环境类型 ====================

export interface DatabaseEnv {
  RECIPE_EASY_DB: D1Database;
  RECIPE_IMAGES: R2Bucket;
  WORKER_URL?: string;
}

// ==================== 国际化相关类型 ====================

export type SupportedLocale = 'en' | 'zh';

export interface LocalizedContent {
  language_code: string;
  name?: string;
  slug?: string;
  title?: string;
  description?: string;
  ingredients?: string;
  seasoning?: string;
  instructions?: string;
  chef_tips?: string;
  tags?: string;
  difficulty?: string;
}

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

// ==================== 导出类型守卫 ====================

export function isValidRecipe(obj: any): obj is Recipe {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.cookingTime === 'number' &&
    typeof obj.servings === 'number' &&
    Array.isArray(obj.ingredients) &&
    Array.isArray(obj.instructions)
  );
}

export function isValidIngredient(obj: any): obj is Ingredient {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'object'
  );
} 