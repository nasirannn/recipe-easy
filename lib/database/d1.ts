// Cloudflare D1 数据库连接工具

export interface Recipe {
  id: number;
  title: string;
  image_url: string;
  description: string;
  tags: string; // JSON string
  cook_time: number;
  servings: number;
  difficulty: string;
  ingredients: string; // JSON string
  seasoning: string; // JSON string
  instructions: string; // JSON string
  chef_tips: string; // JSON string
  created_at?: string;
  updated_at?: string;
}

export interface RecipeResponse {
  id: number;
  title: string;
  image_url: string;
  description: string;
  tags: string[];
  cookTime: number;
  servings: number;
  difficulty: string;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  chefTips: string[];
}

// 将数据库记录转换为 API 响应格式
export function transformRecipe(dbRecipe: Recipe): RecipeResponse {
  return {
    id: dbRecipe.id,
    title: dbRecipe.title,
    image_url: dbRecipe.image_url,
    description: dbRecipe.description,
    tags: JSON.parse(dbRecipe.tags),
    cookTime: dbRecipe.cook_time,
    servings: dbRecipe.servings,
    difficulty: dbRecipe.difficulty,
    ingredients: JSON.parse(dbRecipe.ingredients),
    seasoning: JSON.parse(dbRecipe.seasoning),
    instructions: JSON.parse(dbRecipe.instructions),
    chefTips: JSON.parse(dbRecipe.chef_tips)
  };
}

// 获取食谱列表
export async function getRecipes(
  db: D1Database,
  options: {
    limit?: number;
    offset?: number;
    tag?: string;
    difficulty?: string;
  } = {}
): Promise<{ recipes: RecipeResponse[]; total: number }> {
  const { limit = 10, offset = 0, tag, difficulty } = options;
  
  let query = 'SELECT * FROM recipes';
  let countQuery = 'SELECT COUNT(*) as total FROM recipes';
  const params: any[] = [];
  const conditions: string[] = [];

  // 添加过滤条件
  if (tag) {
    conditions.push('tags LIKE ?');
    params.push(`%"${tag}"%`);
  }

  if (difficulty) {
    conditions.push('difficulty = ?');
    params.push(difficulty);
  }

  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`;
    query += whereClause;
    countQuery += whereClause;
  }

  // 添加排序和分页
  query += ' ORDER BY id ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    // 执行查询
    const [recipesResult, countResult] = await Promise.all([
      db.prepare(query).bind(...params).all(),
      db.prepare(countQuery).bind(...params.slice(0, -2)).first() // 移除 limit 和 offset 参数
    ]);

    const recipes = recipesResult.results.map((recipe: any) => transformRecipe(recipe as Recipe));
    const total = (countResult as any)?.total || 0;

    return { recipes, total };
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Failed to fetch recipes from database');
  }
}

// 根据 ID 获取单个食谱
export async function getRecipeById(db: D1Database, id: number): Promise<RecipeResponse | null> {
  try {
    const result = await db.prepare('SELECT * FROM recipes WHERE id = ?').bind(id).first();
    
    if (!result) {
      return null;
    }

    return transformRecipe(result as Recipe);
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Failed to fetch recipe from database');
  }
}
