import type { Ingredient } from "./constants/ingredients";
import type { ImageModel } from "./services/image-service";

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
