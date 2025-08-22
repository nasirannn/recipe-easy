// ==================== 核心类型定义 ====================

import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import React from 'react';

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
  cssClass?: string; // CSS类名
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
  cuisine_name?: string; // 菜系名称
  cuisine?: Cuisine; // 菜系对象
  imagePath?: string;
  imageModel?: string;
  languageModel?: string;
  language?: string;
  recommended?: boolean;
}

// 数据库食谱类型（用于API响应）
export interface DatabaseRecipe {
  id: string;
  title: string;
  image_path: string | null;
  description: string | null;
  tags: string | null;
  cooking_time: number | null;
  servings: number | null;
  difficulty: string | null;
  ingredients: string;
  seasoning: string | null;
  instructions: string;
  chef_tips: string | null;
  cuisine_id: number | null;
  cuisine_name?: string | null;
  user_id: string | null;
  image_model?: string | null;
  language_model?: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

// 食谱创建和更新输入类型
export interface RecipeInput {
  title: string;
  image_path?: string;
  description?: string;
  tags?: string[];
  cooking_time?: number;
  servings?: number;
  difficulty?: string;
  ingredients: any[] | string;
  seasoning?: any[] | string;
  instructions: any[] | string;
  chef_tips?: string;
  cuisine_id?: number;
  user_id?: string;
  language?: string;
}

// 食谱表单数据
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

export interface ImageGenParams {
  prompt: string;
  style?: ImageStyle;
  negativePrompt?: string;
  size?: ImageSize;
  n?: number;
  model?: ImageModel;
  userId?: string;
  isAdmin?: boolean;
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
  RECIPE_EASY_DB: D1Database;
  RECIPE_IMAGES: R2Bucket;
  WORKER_URL?: string;
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
