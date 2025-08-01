/**
 * 共享类型定义
 */

import type { ImageModel } from "../services/image-service";

// 食材接口定义
export interface Ingredient {
  id: string;
  slug?: string;
  name: string;
  englishName: string;
  category?: {
    id: number;
    slug: string;
    name: string;
  };
  isCustom?: boolean; // 仅用于前端临时标识自定义食材
}

// 菜谱接口定义
export interface Recipe {
  id: string;
  title: string;
  description: string;
  time: number;
  servings: number;
  difficulty: string;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  tags: string[];
  chefTips: string[];
  recommended?: boolean;
  image?: string;
}

// 菜谱生成请求接口
export interface RecipeGenerationRequest {
  ingredients: string[];
  servings: number;  // 每个菜谱的人份数
  recipeCount?: number;  // 生成菜谱的数量
  cookingTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  language?: 'en' | 'zh';
}

// 语言模型类型
export type LanguageModel = 'deepseek' | 'qwenplus' | 'gpt4o_mini';

// 菜谱表单数据接口
export interface RecipeFormData {
  ingredients: Ingredient[];
  servings: number;
  recipeCount: number;
  cookingTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  imageModel?: ImageModel;
  languageModel?: LanguageModel;
} 