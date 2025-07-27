import type { ImageModel } from "./services/image-service";

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
  isCustom?: boolean;
  userId?: string;
}

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

export interface RecipeGenerationRequest {
  ingredients: string[];
  servings: number;  // 每个菜谱的人份数
  recipeCount?: number;  // 生成菜谱的数量
  cookingTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  language?: 'en' | 'zh';
}

export type LanguageModel = 'deepseek' | 'qwenplus' | 'gpt4o-mini';

export interface RecipeFormData {
  ingredients: Ingredient[];
  servings: number;
  recipeCount: number;
  cookingTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  imageModel?: ImageModel;
  languageModel?: LanguageModel; // 新增语言模型字段
}
