import { LanguageModel, ImageModel } from '@/lib/config';

// 用户状态类型
export type UserStatus = 'anonymous' | 'registered' | 'premium';

// 菜谱接口定义（前端使用）
export interface Recipe {
  id: string;
  title: string;
  description: string;
  cookingTime: number;            // ✅ 驼峰命名
  servings: number;
  difficulty: string;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  tags: string[];
  chefTips: string[];             // ✅ 驼峰命名
  recommended?: boolean;
  imagePath?: string;
  cuisineId: number;              // ✅ 驼峰命名，直接使用 ID
  languageModel?: LanguageModel;  // 生成菜谱的语言模型
  imageModel?: ImageModel;        // 生成图片的模型
  userStatus?: UserStatus;        // 用户状态
}

// 菜谱生成请求接口
export interface RecipeGenerationRequest {
  ingredients: string[];
  servings: number;  // 每个菜谱的人份数
  recipeCount: number;  // 生成菜谱的数量（固定为1）
  cookingTime: string;
  difficulty: string;
  cuisine: string;
  language?: 'en' | 'zh';
}

// 菜谱表单数据接口
export interface RecipeFormData {
  ingredients: Ingredient[];
  servings: number;
  recipeCount: number;
  cookingTime: string;
  difficulty: string;
  cuisine: string;
  imageModel?: ImageModel;
  languageModel?: LanguageModel;
}

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