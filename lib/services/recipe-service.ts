import { Recipe as DBRecipe, Cuisine } from '@/lib/database/schema';
import { recipeDb, cuisineDb } from '@/lib/database';

// 从 recipes.tsx 导入的数据类型
type RecipeData = {
  id: number;
  title: string;
  image_url: string;
  description: string;
  tags: string[];
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  ingredients?: string[];
  steps?: string[];
  chefTips?: string[];
};

/**
 * 获取管理员食谱数据（模拟函数，用于兼容现有API）
 */
export async function fetchAdminRecipes(): Promise<{ success: boolean; data: RecipeData[] }> {
  try {
    // 这里可以从数据库获取数据，目前返回空数组
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error fetching admin recipes:', error);
    return {
      success: false,
      data: []
    };
  }
}

/**
 * 将 recipes.tsx 中的数据转换为数据库格式
 */
function convertToDBFormat(recipe: RecipeData): Omit<DBRecipe, 'id' | 'createdAt' | 'updatedAt' | 'expirationDate' | 'cuisine'> {
  return {
    name: recipe.title,
    description: recipe.description,
    ingredients: recipe.ingredients || [],
    seasoning: [], // 从 ingredients 中提取调料，或者设为空数组
    instructions: recipe.steps || [],
    imageUrl: recipe.image_url,
    cookingTime: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    cuisineId: undefined, // 需要根据 tags 映射到菜系ID
    userId: undefined // 设为管理员用户ID或留空
  };
}

/**
 * 根据标签获取或创建菜系
 */
async function getOrCreateCuisine(db: any, tags: string[]): Promise<number | undefined> {
  // 定义菜系映射
  const cuisineMap: { [key: string]: string } = {
    'Chinese': 'Chinese',
    'Italian': 'Italian',
    'French': 'French',
    'Indian': 'Indian',
    'Japanese': 'Japanese',
    'Greek': 'Mediterranean',
    'Thai': 'Thai',
    'Mexican': 'Mexican'
  };

  // 查找匹配的菜系标签
  const cuisineTag = tags.find(tag => cuisineMap[tag]);
  if (!cuisineTag) return undefined;

  const cuisineName = cuisineMap[cuisineTag];
  
  try {
    // 先查找是否已存在该菜系
    const existingCuisines = await cuisineDb.listCuisines(db);
    const existingCuisine = existingCuisines.find(c => c.name === cuisineName);
    
    if (existingCuisine) {
      return existingCuisine.id;
    }

    // 创建新菜系
    const newCuisine = await cuisineDb.createCuisine(db, {
      name: cuisineName,
      description: `${cuisineTag} cuisine`
    });
    
    return newCuisine.id;
  } catch (error) {
    console.error(`Error creating cuisine for ${cuisineTag}:`, error);
    return undefined;
  }
}

/**
 * 将示例数据导入到数据库
 */
export async function importSampleRecipes(db: any, sampleRecipes: RecipeData[]): Promise<{ success: boolean; imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  for (const recipeData of sampleRecipes) {
    try {
      // 转换为数据库格式
      const dbRecipe = convertToDBFormat(recipeData);
      
      // 获取或创建菜系
      const cuisineId = await getOrCreateCuisine(db, recipeData.tags);
      if (cuisineId) {
        dbRecipe.cuisineId = cuisineId;
      }

      // 创建食谱
      await recipeDb.createRecipe(db, dbRecipe);
      imported++;
      
      console.log(`Successfully imported recipe: ${recipeData.title}`);
    } catch (error) {
      const errorMsg = `Failed to import recipe "${recipeData.title}": ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return {
    success: errors.length === 0,
    imported,
    errors
  };
}
