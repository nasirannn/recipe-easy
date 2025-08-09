// ==================== Recipe Easy Cloudflare Worker ====================
// 优化版本：改进结构、类型安全、错误处理，但保持功能完整

import { D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  RECIPE_EASY_DB: D1Database;
  RECIPE_IMAGES: R2Bucket;
  WORKER_URL?: string;
}

// ==================== 工具函数 ====================

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRecipeId(): string {
  const timestamp = Date.now().toString(36);
  const random = generateRandomString(4).toLowerCase();
  return `recipe-${timestamp}-${random}`;
}

function generateImageId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(8);
  return `IMG-${timestamp}-${random}`;
}

function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(6);
  return `TXN-${timestamp}-${random}`;
}

// 验证用户ID格式
function validateUserId(userId: string | null): boolean {
  if (!userId || typeof userId !== 'string') return false;
  const userIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return userIdRegex.test(userId);
}

// 验证菜谱ID格式
function validateRecipeId(recipeId: string | null): boolean {
  if (!recipeId || typeof recipeId !== 'string') return false;
  return /^\d+$/.test(recipeId) || /^recipe-[a-z0-9-]+$/.test(recipeId);
}

// CORS 头设置
function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

// 创建JSON响应
function createJsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
  });
}

// 错误响应
function createErrorResponse(error: string, status: number = 400, details?: string): Response {
  return createJsonResponse({ success: false, error, details }, status);
}

// 成功响应
function createSuccessResponse(data: any, status: number = 200): Response {
  return createJsonResponse({ success: true, ...data }, status);
}

// ==================== 记录模型使用情况 ====================

async function recordModelUsage(db: D1Database, params: {
  model_name: string;
  model_type: 'language' | 'image';
  model_response_id: string;
  request_details?: string;
}): Promise<void> {
  try {
    const stmt = db.prepare(`
      INSERT INTO model_usage_records (id, model_name, model_type, request_details, created_at)
      VALUES (?, ?, ?, ?, DATETIME('now'))
    `);
    
    await stmt.bind(
      params.model_response_id,
      params.model_name,
      params.model_type,
      params.request_details || null
    ).run();
    
    console.log(`✅ Model usage recorded: ${params.model_type} model ${params.model_name}`);
  } catch (error) {
    console.error('❌ Failed to record model usage:', error);
  }
}

// ==================== 系统配置工具 ====================

async function getSystemConfig(db: D1Database, key: string, defaultValue: any): Promise<any> {
  try {
    const result = await db.prepare(`
      SELECT value FROM system_configs WHERE key = ?
    `).bind(key).first();
    
    if (!result?.value) return defaultValue;
    
    const value = String(result.value);
    
    if (typeof defaultValue === 'number') {
      const numValue = parseInt(value, 10);
      return isNaN(numValue) ? defaultValue : numValue;
    } else if (typeof defaultValue === 'boolean') {
      return value.toLowerCase() === 'true';
    }
    
    return value;
  } catch (error) {
    console.error(`Error getting system config ${key}:`, error);
    return defaultValue;
  }
}

// ==================== 路由处理器 ====================

// 获取文件Content-Type
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

async function handleImages(request: Request, bucket: R2Bucket): Promise<Response> {
  try {
    const url = new URL(request.url);
    const imagePath = url.pathname.replace('/images/', '');
    
    if (!imagePath) {
      return createErrorResponse('Image path is required', 400);
    }

    const object = await bucket.get(imagePath);
    if (!object) {
      return createErrorResponse('Image not found', 404);
    }

    const contentType = getContentType(imagePath);
    
    return new Response(object.body as any, {
      headers: {
        ...getCorsHeaders(),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Image serving error:', error);
    return createErrorResponse('Failed to serve image', 500);
  }
}

async function handleIngredients(request: Request, db: D1Database): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        i.id, i.slug, i.category_id,
        COALESCE(i18n.name, i.name) as ingredient_name,
        COALESCE(c18n.name, c.name) as category_name
      FROM ingredients i
      LEFT JOIN ingredients_i18n i18n ON i.id = i18n.ingredient_id AND i18n.language_code = ?
      LEFT JOIN ingredient_categories c ON i.category_id = c.id
      LEFT JOIN ingredient_categories_i18n c18n ON i.category_id = c18n.category_id AND c18n.language_code = ?
    `;
    
    const params: any[] = [language, language];
    
    if (category) {
      const categoryId = parseInt(category);
      if (!isNaN(categoryId)) {
        sql += ' WHERE i.category_id = ?';
        params.push(categoryId);
      }
    }
    
    sql += ' ORDER BY i.id ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await db.prepare(sql).bind(...params).all();
    const ingredients = results || [];

    const formattedIngredients = ingredients.map((ingredient: any) => {
      const slugMap: Record<number, string> = {
        1: 'meat', 2: 'seafood', 3: 'vegetables', 4: 'fruits',
        5: 'dairy-eggs', 6: 'grains-bread', 7: 'nuts-seeds',
        8: 'herbs-spices', 9: 'oils-condiments'
      };
      
      return {
        id: ingredient.id,
        slug: ingredient.slug || `ingredient-${ingredient.id}`,
        name: ingredient.ingredient_name || `Ingredient ${ingredient.id}`,
        englishName: ingredient.ingredient_name || `Ingredient ${ingredient.id}`,
        category: {
          id: ingredient.category_id || 1,
          slug: slugMap[ingredient.category_id] || 'other',
          name: ingredient.category_name || 'Other'
        }
      };
    });

    return createSuccessResponse({
      results: formattedIngredients,
      total: formattedIngredients.length,
      limit, offset, language,
      source: 'database'
    });

  } catch (error) {
    console.error('Ingredients API error:', error);
    return createErrorResponse(
      '获取食材数据失败',
      500,
      error instanceof Error ? error.message : '未知错误'
    );
  }
}

async function handleCuisines(request: Request, db: D1Database): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';

    const { results } = await db.prepare(`
      SELECT 
        c.id, c.name as cuisine_name, c.slug as cuisine_slug,
        COALESCE(c18n.name, c.name) as localized_cuisine_name,
        COALESCE(c18n.slug, c.slug) as localized_cuisine_slug
      FROM cuisines c
      LEFT JOIN cuisines_i18n c18n ON c.id = c18n.cuisine_id AND c18n.language_code = ?
      ORDER BY c.id ASC
    `).bind(language).all();

    const cuisines = results || [];
    const formattedCuisines = cuisines.map((cuisine: any) => ({
      id: cuisine.id,
      name: cuisine.localized_cuisine_name || cuisine.cuisine_name || `Cuisine ${cuisine.id}`,
      slug: cuisine.localized_cuisine_slug || cuisine.cuisine_slug || `cuisine-${cuisine.id}`
    }));

    return createSuccessResponse({
      data: formattedCuisines,
      total: formattedCuisines.length,
      language,
      source: 'database'
    });

  } catch (error) {
    console.error('Cuisines API error:', error);
    return createErrorResponse(
      '获取菜系数据失败',
      500,
      error instanceof Error ? error.message : '未知错误'
    );
  }
}

async function handleRecipes(request: Request, db: D1Database, env: Env): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const cuisineId = searchParams.get('cuisineId');
    const language = searchParams.get('lang') || 'en';

    // 简化的菜谱查询 - 这里可以根据需要扩展
    let sql = `
      SELECT 
        r.id, r.title, r.description, r.cooking_time, r.servings, r.difficulty,
        r.ingredients, r.seasoning, r.instructions, r.tags, r.chef_tips,
        r.cuisine_id, r.user_id, r.created_at, r.updated_at,
        c.name as cuisine_name
      FROM recipes r
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('(r.title LIKE ? OR r.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (cuisineId) {
      const cuisineIdInt = parseInt(cuisineId);
      if (!isNaN(cuisineIdInt)) {
        conditions.push('r.cuisine_id = ?');
        params.push(cuisineIdInt);
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await db.prepare(sql).bind(...params).all();
    const recipes = results || [];

    // 获取图片信息
    const recipeIds = recipes.map((r: any) => r.id);
    let imageMap: Record<string, string> = {};
    
    if (recipeIds.length > 0) {
      const imageResults = await db.prepare(`
        SELECT r.id as recipe_id, ri.image_path
        FROM recipes r
        LEFT JOIN recipe_images ri ON r.id = ri.recipe_id
        WHERE r.id IN (${recipeIds.map(() => '?').join(',')})
      `).bind(...recipeIds).all();
      
      imageResults.results.forEach((img: any) => {
        if (img.image_path) {
          const baseUrl = env.WORKER_URL || 'https://api.recipe-easy.com';
          imageMap[img.recipe_id] = `${baseUrl}/images/${img.image_path}`;
        }
      });
    }

    const formattedRecipes = recipes.map((recipe: any) => {
      const slugMap: Record<number, string> = {
        1: 'chinese', 2: 'italian', 3: 'french', 4: 'indian',
        5: 'japanese', 6: 'mediterranean', 7: 'thai', 8: 'mexican', 9: 'others'
      };
      
      return {
        id: recipe.id,
        title: recipe.title || `Recipe ${recipe.id}`,
        description: recipe.description || `Description for Recipe ${recipe.id}`,
        imagePath: imageMap[recipe.id] || null,
        ingredients: JSON.parse(recipe.ingredients || '[]'),
        seasoning: JSON.parse(recipe.seasoning || '[]'),
        instructions: JSON.parse(recipe.instructions || '[]'),
        chefTips: JSON.parse(recipe.chef_tips || '[]'),
        tags: JSON.parse(recipe.tags || '[]'),
        difficulty: recipe.difficulty || 'easy',
        cookingTime: recipe.cooking_time || 30,
        servings: recipe.servings || 4,
        user_id: recipe.user_id,
        cuisine: {
          id: recipe.cuisine_id || 1,
          slug: slugMap[Number(recipe.cuisine_id)] || 'other',
          name: recipe.cuisine_name || 'Other'
        },
        created_at: recipe.created_at,
        updated_at: recipe.updated_at
      };
    });

    return createSuccessResponse({
      results: formattedRecipes,
      total: formattedRecipes.length,
      limit, offset, language,
      source: 'database'
    });

  } catch (error) {
    console.error('Recipes API error:', error);
    return createErrorResponse(
      '获取菜谱数据失败',
      500,
      error instanceof Error ? error.message : '未知错误'
    );
  }
}

async function handleModelUsage(request: Request, db: D1Database): Promise<Response> {
  try {
    const body = await request.json();
    const { model_name, model_type, model_response_id, request_details } = body;

    if (!model_name || !model_type || !model_response_id) {
      return createErrorResponse('Missing required fields: model_name, model_type, model_response_id', 400);
    }

    if (!['language', 'image'].includes(model_type)) {
      return createErrorResponse('Invalid model_type. Must be either "language" or "image"', 400);
    }

    await recordModelUsage(db, {
      model_name,
      model_type: model_type as 'language' | 'image',
      model_response_id,
      request_details
    });

    return createSuccessResponse({
      message: 'Model usage recorded successfully'
    });

  } catch (error) {
    console.error('Model usage recording error:', error);
    return createErrorResponse(
      'Failed to record model usage',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function handleCategories(request: Request, db: D1Database): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';

    const { results } = await db.prepare(`
      SELECT 
        c.id,
        COALESCE(c18n.name, c.name) as category_name
      FROM ingredient_categories c
      LEFT JOIN ingredient_categories_i18n c18n ON c.id = c18n.category_id AND c18n.language_code = ?
      ORDER BY c.id ASC
    `).bind(language).all();

    const categories = results || [];
    const formattedCategories = categories.map((category: any) => {
      const slugMap: Record<number, string> = {
        1: 'meat', 2: 'seafood', 3: 'vegetables', 4: 'fruits',
        5: 'dairy-eggs', 6: 'grains-bread', 7: 'nuts-seeds',
        8: 'herbs-spices', 9: 'oils-condiments'
      };
      
      return {
        id: category.id,
        slug: slugMap[category.id] || `category-${category.id}`,
        name: category.category_name || `Category ${category.id}`,
        sort_order: category.id
      };
    });

    return createSuccessResponse({
      data: formattedCategories,
      total: formattedCategories.length,
      language,
      source: 'database'
    });

  } catch (error) {
    console.error('Categories API error:', error);
    return createErrorResponse(
      '获取分类数据失败',
      500,
      error instanceof Error ? error.message : '未知错误'
    );
  }
}

async function handleUserUsage(request: Request, db: D1Database): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    const rawIsAdmin = searchParams.get('isAdmin');
    
    if (!validateUserId(rawUserId)) {
      return createErrorResponse('Invalid user ID format', 400);
    }
    
    const userId = rawUserId!;
    const isAdmin = rawIsAdmin === 'true';

    if (request.method === 'GET') {
      // 获取用户积分
      const userCredits = await db.prepare(`
        SELECT * FROM user_credits WHERE user_id = ?
      `).bind(userId).first();

      if (!userCredits) {
        // 创建新用户积分记录
        const initialCredits = await getSystemConfig(db, 'initial_credits', 100);
        const creditId = generateTransactionId();
        
        const newCredits = await db.prepare(`
          INSERT INTO user_credits (id, user_id, credits, total_earned, total_spent, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, DATETIME('now'), DATETIME('now'))
          RETURNING *
        `).bind(creditId, userId, initialCredits, initialCredits).first();

        return createSuccessResponse({
          data: {
            credits: newCredits,
            canGenerate: true,
            availableCredits: initialCredits,
          },
        });
      }

      // 检查是否可以生成
      const adminUnlimited = await getSystemConfig(db, 'admin_unlimited', true);
      const canGenerate = (isAdmin && adminUnlimited) || (userCredits.credits as number) > 0;

      return createSuccessResponse({
        data: {
          credits: userCredits,
          canGenerate,
          availableCredits: userCredits.credits,
        },
      });

    } else if (request.method === 'POST') {
      const body = await request.json();
      const { userId: bodyUserId, action, amount, description } = body;

      if (!validateUserId(bodyUserId)) {
        return createErrorResponse('Invalid user ID format', 400);
      }

      const userId = bodyUserId;

      if (action === 'spend') {
        // 消费积分
        const generationCost = amount || await getSystemConfig(db, 'generation_cost', 1);
        
        const userCredits = await db.prepare(`
          SELECT * FROM user_credits WHERE user_id = ?
        `).bind(userId).first();

        if (!userCredits || userCredits.credits < generationCost) {
          return createErrorResponse('Insufficient credits.', 400);
        }

        const updatedCredits = await db.prepare(`
          UPDATE user_credits 
          SET credits = credits - ?, total_spent = total_spent + ?, updated_at = DATETIME('now')
          WHERE user_id = ?
          RETURNING *
        `).bind(generationCost, generationCost, userId).first();

        // 记录交易
        const transactionId = generateTransactionId();
        const transaction = await db.prepare(`
          INSERT INTO credit_transactions (id, user_id, type, amount, reason, description, created_at)
          VALUES (?, ?, 'spend', ?, 'generation', ?, DATETIME('now'))
          RETURNING *
        `).bind(transactionId, userId, generationCost, description || `Generated a recipe for ${generationCost} credits.`).first();

        return createSuccessResponse({
          message: `Successfully spent ${generationCost} credits.`,
          data: { credits: updatedCredits, transactionId: transaction.id }
        });
      }

      return createErrorResponse('Invalid action', 400);
    }

    return createErrorResponse('Method not allowed', 405);

  } catch (error) {
    console.error('User usage API error:', error);
    return createErrorResponse(
      'Failed to process user usage request',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ==================== 主Worker ====================

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: getCorsHeaders() });
    }

    try {
      // 健康检查路由
      if (path === '/health' || path === '/api/health') {
        return createSuccessResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'recipe-easy-api'
        });
      }

      // 根路径
      if (path === '/') {
        return createSuccessResponse({
          message: 'Recipe Easy API',
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          endpoints: [
            '/health',
            '/api/categories',
            '/api/ingredients', 
            '/api/cuisines',
            '/api/recipes',
            '/api/user-usage'
          ]
        });
      }

      // 图片服务路由
      if (path.startsWith('/images/')) {
        return await handleImages(request, env.RECIPE_IMAGES);
      }

      // API路由处理
      if (path === '/api/categories' && request.method === 'GET') {
        return await handleCategories(request, env.RECIPE_EASY_DB);
      }
      
      if (path === '/api/ingredients' && request.method === 'GET') {
        return await handleIngredients(request, env.RECIPE_EASY_DB);
      }
      
      if (path === '/api/cuisines' && request.method === 'GET') {
        return await handleCuisines(request, env.RECIPE_EASY_DB);
      }
      
      if (path === '/api/user-usage' && (request.method === 'GET' || request.method === 'POST')) {
        return await handleUserUsage(request, env.RECIPE_EASY_DB);
      }

      if (path === '/api/recipes' && request.method === 'GET') {
        return await handleRecipes(request, env.RECIPE_EASY_DB, env);
      }

      if (path === '/api/model-usage' && request.method === 'POST') {
        return await handleModelUsage(request, env.RECIPE_EASY_DB);
      }

      // 默认响应
      return createErrorResponse('API endpoint not found', 404);

    } catch (error) {
      console.error('Worker error:', error);
      return createErrorResponse(
        'Internal server error',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
};

export default worker; 