// 数据库菜谱类型定义（用于API内部）
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
  created_at: string;
  updated_at: string;
}

// 创建菜谱输入类型（数据库格式）
export interface CreateRecipeInput {
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
}

// 更新菜谱输入类型（数据库格式）
export interface UpdateRecipeInput {
  title?: string;
  image_path?: string | null;
  description?: string | null;
  tags?: string[];
  cooking_time?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  ingredients?: any[] | string;
  seasoning?: any[] | string | null;
  instructions?: any[] | string;
  chef_tips?: string | null;
  cuisine_id?: number | null;
} 