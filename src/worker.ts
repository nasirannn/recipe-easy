import { D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  RECIPE_EASY_DB: D1Database;
  RECIPE_IMAGES: R2Bucket;
  WORKER_URL?: string;
}

// ID 生成工具函数
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRecipeId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(6);
  return `REC-${timestamp}-${random}`;
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

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 设置CORS头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 图片服务路由
      if (path.startsWith('/images/')) {
        return await handleImages(request, env.RECIPE_IMAGES, corsHeaders);
      }

      // API路由处理
      if (path === '/api/categories') {
        if (request.method === 'GET') {
          return await handleCategories(request, env.RECIPE_EASY_DB, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }
      
      if (path === '/api/ingredients') {
        if (request.method === 'GET') {
          return await handleIngredients(request, env.RECIPE_EASY_DB, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }
      
      if (path === '/api/cuisines') {
        if (request.method === 'GET') {
          return await handleCuisines(request, env.RECIPE_EASY_DB, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }
      
      if (path === '/api/user-usage') {
        if (request.method === 'GET' || request.method === 'POST') {
          return await handleUserUsage(request, env.RECIPE_EASY_DB, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }
      
      if (path === '/api/recipes') {
        if (request.method === 'GET') {
          return await handleRecipes(request, env.RECIPE_EASY_DB, env, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }

      // 处理获取用户菜谱的API路由 /api/recipes/user/[userId] - 必须在单个菜谱路由之前
      if (path.startsWith('/api/recipes/user/') && path !== '/api/recipes/user') {
        if (request.method === 'GET') {
          return await handleGetUserRecipes(request, env.RECIPE_EASY_DB, env, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }



      if (path === '/api/admin/add-columns') {
        if (request.method === 'POST') {
          return await handleAddColumns(request, env.RECIPE_EASY_DB, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }

      if (path === '/api/system-configs') {
        if (request.method === 'GET' || request.method === 'POST') {
          return await handleSystemConfigs(request, env.RECIPE_EASY_DB, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }

      if (path === '/api/upload-image') {
        if (request.method === 'POST') {
          return await handleUploadImage(request, env, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }

      if (path === '/api/recipes/save') {
        if (request.method === 'POST') {
          return await handleSaveRecipe(request, env, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }

      // 处理单个菜谱的API路由 /api/recipes/[id] - 根据HTTP方法区分操作
      if (path.startsWith('/api/recipes/') && path !== '/api/recipes' && !path.startsWith('/api/recipes/user/')) {
        if (request.method === 'DELETE') {
          return await handleDeleteRecipe(request, env, corsHeaders);
        } else {
          return await handleSingleRecipe(request, env.RECIPE_EASY_DB, env, corsHeaders);
        }
      }

      // 默认响应
      return new Response('API endpoint not found', { 
        status: 404,
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// 处理图片服务
async function handleImages(request: Request, bucket: R2Bucket, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const url = new URL(request.url);
    const imagePath = url.pathname.replace('/images/', '');
    
    if (!imagePath) {
      return new Response('Image path is required', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // 从R2存储桶获取图片
    const object = await bucket.get(imagePath);
    
    if (!object) {
      return new Response('Image not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    // 根据文件扩展名设置正确的Content-Type
    const contentType = getContentType(imagePath);
    
    return new Response(object.body as any, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 缓存1年
      },
    });
  } catch (error) {
    console.error('Image serving error:', error);
    return new Response('Failed to serve image', { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

// 获取文件Content-Type
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

// 处理分类API
async function handleCategories(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';

    const { results } = await db.prepare(`
      SELECT 
        c.id,
        c18n.name as category_name
      FROM ingredient_categories c
      LEFT JOIN ingredient_categories_i18n c18n ON c.id = c18n.category_id AND c18n.language_code = ?
      ORDER BY c.id ASC
    `).bind(language).all();

    const categories = results || [];
    const formattedCategories = categories.map((category: any) => {
      // 根据分类ID映射到正确的slug
      const slugMap: Record<number, string> = {
        1: 'meat',
        2: 'seafood', 
        3: 'vegetables',
        4: 'fruits',
        5: 'dairy-eggs',
        6: 'grains-bread',
        7: 'nuts-seeds',
        8: 'herbs-spices',
        9: 'oils-condiments'
      };
      
      return {
        id: category.id,
        slug: slugMap[category.id] || `category-${category.id}`,
        name: category.category_name || `Category ${category.id}`,
        sort_order: category.id
      };
    });

    return new Response(JSON.stringify({
      success: true,
      data: formattedCategories,
      total: formattedCategories.length,
      language,
      source: 'database'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Categories API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '获取分类数据失败',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 处理食材API
async function handleIngredients(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        i.id,
        i.slug,
        i.category_id,
        i18n.name as ingredient_name,
        c18n.name as category_name
      FROM ingredients i
      LEFT JOIN ingredients_i18n i18n ON i.id = i18n.ingredient_id AND i18n.language_code = ?
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
      // 根据分类ID映射到正确的slug
      const slugMap: Record<number, string> = {
        1: 'meat',
        2: 'seafood', 
        3: 'vegetables',
        4: 'fruits',
        5: 'dairy-eggs',
        6: 'grains-bread',
        7: 'nuts-seeds',
        8: 'herbs-spices',
        9: 'oils-condiments'
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

    return new Response(JSON.stringify({
      success: true,
      results: formattedIngredients,
      total: formattedIngredients.length,
      limit,
      offset,
      language,
      source: 'database'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Ingredients API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '获取食材数据失败',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 处理菜系API
async function handleCuisines(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';

    const { results } = await db.prepare(`
      SELECT 
        c.id,
        c.name as cuisine_name,
        COALESCE(c18n.name, c.name) as localized_cuisine_name
      FROM cuisines c
      LEFT JOIN cuisines_i18n c18n ON c.id = c18n.cuisine_id AND c18n.language_code = ?
      ORDER BY c.id ASC
    `).bind(language).all();

    const cuisines = results || [];
    const formattedCuisines = cuisines.map((cuisine: any) => {
      return {
        id: cuisine.id,
        name: cuisine.localized_cuisine_name || cuisine.cuisine_name || `Cuisine ${cuisine.id}`
      };
    });

    return new Response(JSON.stringify({
      success: true,
      data: formattedCuisines,
      total: formattedCuisines.length,
      language,
      source: 'database'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Cuisines API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '获取菜系数据失败',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 获取系统配置的辅助函数
async function getSystemConfig(db: D1Database, key: string, defaultValue: string | number | boolean): Promise<any> {
  try {
    const result = await db.prepare(`
      SELECT value FROM system_configs WHERE key = ?
    `).bind(key).first();
    
    if (!result || !result.value) {
      return defaultValue;
    }
    
    const value = String(result.value);
    
    // 根据默认值类型转换返回值
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

// 处理用户积分API
async function handleUserUsage(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('isAdmin') === 'true';

    if (request.method === 'GET') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 获取用户积分
      const userCredits = await db.prepare(`
        SELECT * FROM user_credits WHERE user_id = ?
      `).bind(userId).first();

      if (!userCredits) {
        // 从系统配置中获取初始积分
        const initialCredits = await getSystemConfig(db, 'initial_credits', 100);
        
        // 创建新用户积分记录
        const creditId = generateTransactionId();
        const newCredits = await db.prepare(`
          INSERT INTO user_credits (id, user_id, credits, total_earned, total_spent, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, DATETIME('now'), DATETIME('now'))
          RETURNING *
        `).bind(creditId, userId, initialCredits, initialCredits).first();

        return new Response(JSON.stringify({
          success: true,
          data: {
            credits: newCredits,
            canGenerate: true,
            availableCredits: initialCredits,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查是否可以生成
      const adminUnlimited = await getSystemConfig(db, 'admin_unlimited', true);
      const canGenerate = (isAdmin && adminUnlimited) || (userCredits.credits as number) > 0;

      return new Response(JSON.stringify({
        success: true,
        data: {
          credits: userCredits,
          canGenerate,
          availableCredits: userCredits.credits,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (request.method === 'POST') {
      const body = await request.json();
      const { userId, action, amount, description } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'spend') {
        // 从系统配置中获取生成消耗
        const generationCost = amount || await getSystemConfig(db, 'generation_cost', 1);
        
        // 消费积分
        const userCredits = await db.prepare(`
          SELECT * FROM user_credits WHERE user_id = ?
        `).bind(userId).first();

        if (!userCredits || userCredits.credits < generationCost) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Insufficient credits.' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
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

        return new Response(JSON.stringify({
          success: true,
          message: `Successfully spent ${generationCost} credits.`,
          data: { credits: updatedCredits, transactionId: transaction.id }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (action === 'earn') {
        // 增加积分
        const earnAmount = amount || 0;
        
        if (earnAmount <= 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Invalid earn amount.' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 获取用户积分记录
        const userCredits = await db.prepare(`
          SELECT * FROM user_credits WHERE user_id = ?
        `).bind(userId).first();

        if (!userCredits) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'User credits record not found.' 
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const updatedCredits = await db.prepare(`
          UPDATE user_credits 
          SET credits = credits + ?, total_earned = total_earned + ?, updated_at = DATETIME('now')
          WHERE user_id = ?
          RETURNING *
        `).bind(earnAmount, earnAmount, userId).first();

        // 记录交易
        const transactionId = generateTransactionId();
        const transaction = await db.prepare(`
          INSERT INTO credit_transactions (id, user_id, type, amount, reason, description, created_at)
          VALUES (?, ?, 'earn', ?, 'manual', ?, DATETIME('now'))
          RETURNING *
        `).bind(transactionId, userId, earnAmount, description || `Manually earned ${earnAmount} credits.`).first();

        return new Response(JSON.stringify({
          success: true,
          message: `Successfully earned ${earnAmount} credits.`,
          data: { credits: updatedCredits, transactionId: transaction.id }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('User usage API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process user usage request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 处理菜谱API
async function handleRecipes(request: Request, db: D1Database, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const cuisineId = searchParams.get('cuisineId');
    const language = searchParams.get('lang') || 'en';
    const adminOnly = searchParams.get('adminOnly') === 'true';

    // 检查是否存在 recipes_i18n 表
    let hasI18nTable = false;
    try {
      const tableCheck = await db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='recipes_i18n'
      `).first();
      hasI18nTable = !!tableCheck;
    } catch (e) {
      hasI18nTable = false;
    }

    let sql = `
      SELECT 
        r.*,
        c.name as cuisine_name,
        COALESCE(c18n.name, c.name) as localized_cuisine_name
    `;

    // 如果有国际化表，添加菜谱的本地化字段
    if (hasI18nTable) {
      sql += `,
        COALESCE(r18n.title, r.title) as localized_title,
        COALESCE(r18n.description, r.description) as localized_description,
        COALESCE(r18n.ingredients, r.ingredients) as localized_ingredients,
        COALESCE(r18n.seasoning, r.seasoning) as localized_seasoning,
        COALESCE(r18n.instructions, r.instructions) as localized_instructions,
        COALESCE(r18n.chef_tips, r.chef_tips) as localized_chef_tips,
        COALESCE(r18n.tags, r.tags) as localized_tags,
        COALESCE(r18n.difficulty, r.difficulty) as localized_difficulty
      `;
    }

    sql += `
      FROM recipes r
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      LEFT JOIN cuisines_i18n c18n ON c.id = c18n.cuisine_id AND c18n.language_code = ?
    `;



    const params: any[] = [language];

    // 如果有国际化表，添加菜谱国际化关联
    if (hasI18nTable) {
      sql += ` LEFT JOIN recipes_i18n r18n ON r.id = r18n.recipe_id AND r18n.language_code = ?`;
      params.push(language);
    }

    const conditions: string[] = [];

    // 如果需要只获取管理员菜谱，先查询管理员ID
    let adminUserId: string | null = null;
    if (adminOnly) {
      try {
        const adminConfig = await db.prepare(`
          SELECT value FROM system_configs WHERE key = 'admin_id'
        `).first();
        adminUserId = String(adminConfig?.value || '');
      } catch (error) {
        console.error('Error fetching admin_id from system_configs:', error);
      }
    }

    if (search) {
      if (hasI18nTable) {
        conditions.push('(COALESCE(r18n.title, r.title) LIKE ? OR COALESCE(r18n.description, r.description) LIKE ?)');
      } else {
        conditions.push('(r.title LIKE ? OR r.description LIKE ?)');
      }
      params.push(`%${search}%`, `%${search}%`);
    }

    if (cuisineId) {
      const cuisineIdInt = parseInt(cuisineId);
      if (!isNaN(cuisineIdInt)) {
        conditions.push('r.cuisine_id = ?');
        params.push(cuisineIdInt);
      }
    }

    // 如果需要只获取管理员菜谱，添加管理员过滤条件
    if (adminOnly && adminUserId) {
      conditions.push('r.user_id = ?');
      params.push(adminUserId);
    }



    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await db.prepare(sql).bind(...params).all();
    const recipes = results || [];

    // 获取所有菜谱的图片信息
    const recipeIds = recipes.map((r: any) => r.id);
    let imageMap: Record<string, string> = {};
    
    console.log('Fetching images for recipe IDs:', recipeIds);
    
    if (recipeIds.length > 0) {
      // 使用正确的关联查询：通过 recipes.image_id 关联 recipe_images.id
      const imageResults = await db.prepare(`
        SELECT r.id as recipe_id, ri.image_path
        FROM recipes r
        LEFT JOIN recipe_images ri ON r.image_id = ri.id
        WHERE r.id IN (${recipeIds.map(() => '?').join(',')})
      `).bind(...recipeIds).all();
      
      console.log('Image query results:', imageResults.results);
      
      imageResults.results.forEach((img: any) => {
        if (img.image_path) {
          // 使用环境变量或默认域名
          const baseUrl = env.WORKER_URL || 'https://api.recipe-easy.com';
          imageMap[img.recipe_id] = `${baseUrl}/images/${img.image_path}`;
        }
      });
      
      console.log('Final imageMap:', imageMap);
    }

    const formattedRecipes = recipes.map((recipe: any) => {
      // 根据菜谱ID映射到正确的slug
      const slugMap: Record<number, string> = {
        1: 'meat',
        2: 'seafood', 
        3: 'vegetables',
        4: 'fruits',
        5: 'dairy-eggs',
        6: 'grains-bread',
        7: 'nuts-seeds',
        8: 'herbs-spices',
        9: 'oils-condiments'
      };
      
      // 优先使用直接的 image_path 字段，如果没有则使用关联查询的结果
      let imagePath = recipe.image_path || imageMap[recipe.id] || null;
      
      return {
        id: recipe.id,
        slug: recipe.slug || `recipe-${recipe.id}`,
        title: recipe.localized_title || recipe.title || `Recipe ${recipe.id}`,
        description: recipe.localized_description || recipe.description || `Description for Recipe ${recipe.id}`,
        imagePath: imagePath, // 优先使用直接的 image_path，否则使用关联查询的结果
        ingredients: recipe.localized_ingredients || recipe.ingredients || [],
        seasoning: recipe.localized_seasoning || recipe.seasoning || [],
        instructions: recipe.localized_instructions || recipe.instructions || [],
        chefTips: recipe.localized_chef_tips || recipe.chef_tips || [],
        tags: recipe.localized_tags || recipe.tags || [],
        difficulty: recipe.localized_difficulty || recipe.difficulty || 'easy',
        cookingTime: recipe.cooking_time || 30, // 统一返回驼峰格式
        servings: recipe.servings || 4,
        user_id: recipe.user_id, // 添加用户ID
        cuisine: {
          id: recipe.cuisine_id || 1,
          slug: slugMap[Number(recipe.cuisine_id)] || 'other',
          name: recipe.localized_cuisine_name || recipe.cuisine_name || 'Other'
        },
        created_at: recipe.created_at,
        updated_at: recipe.updated_at
      };
    });

    return new Response(JSON.stringify({
      success: true,
      results: formattedRecipes,
      total: formattedRecipes.length,
      limit,
      offset,
      language,
      source: 'database'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Recipes API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '获取菜谱数据失败',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 处理添加列API
async function handleAddColumns(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const body = await request.json();
    const { action, tableName, columnName, columnType } = body;

    // 检查表结构
    if (action === 'check_tables') {
      const tables = ['recipes', 'recipes_i18n', 'recipe_images', 'user_credits', 'credit_transactions'];
      const tableStructures: any = {};

      for (const table of tables) {
        try {
          const columns = await db.prepare(`PRAGMA table_info(${table})`).all();
          tableStructures[table] = columns.results || [];
        } catch (e) {
          tableStructures[table] = { error: 'Table not found' };
        }
      }

      return new Response(JSON.stringify({
        success: true,
        tableStructures
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 添加列的逻辑
    if (!tableName || !columnName || !columnType) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const existingColumns = await db.prepare(`
      PRAGMA table_info(${tableName})
    `).all();

    const existingColumnNames = (existingColumns.results || []).map((col: any) => col.name);

    if (existingColumnNames.includes(columnName)) {
      return new Response(JSON.stringify({ error: `Column ${columnName} already exists in table ${tableName}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sql = `
      ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}
    `;

    await db.prepare(sql).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Column ${columnName} added to table ${tableName}`,
      tableName,
      columnName,
      columnType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Add Columns API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to add column',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 处理单个菜谱API
async function handleSingleRecipe(request: Request, db: D1Database, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const recipeId = pathParts[pathParts.length - 1]; // 获取最后一个部分作为ID
    const { searchParams } = url;
    const language = searchParams.get('lang') || 'en';

    if (!recipeId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid recipe ID'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 检查是否存在 recipes_i18n 表
    let hasI18nTable = false;
    try {
      const tableCheck = await db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='recipes_i18n'
      `).first();
      hasI18nTable = !!tableCheck;
    } catch (e) {
      hasI18nTable = false;
    }

    let sql = `
      SELECT 
        r.*,
        c.name as cuisine_name,
        COALESCE(c18n.name, c.name) as localized_cuisine_name
    `;

    // 如果有国际化表，添加菜谱的本地化字段
    if (hasI18nTable) {
      sql += `,
        COALESCE(r18n.title, r.title) as localized_title,
        COALESCE(r18n.description, r.description) as localized_description,
        COALESCE(r18n.ingredients, r.ingredients) as localized_ingredients,
        COALESCE(r18n.seasoning, r.seasoning) as localized_seasoning,
        COALESCE(r18n.instructions, r.instructions) as localized_instructions,
        COALESCE(r18n.chef_tips, r.chef_tips) as localized_chef_tips,
        COALESCE(r18n.tags, r.tags) as localized_tags,
        COALESCE(r18n.difficulty, r.difficulty) as localized_difficulty
      `;
    }

    sql += `
      FROM recipes r
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      LEFT JOIN cuisines_i18n c18n ON c.id = c18n.cuisine_id AND c18n.language_code = ?
      WHERE r.id = ?
    `;

    const params: any[] = [language, recipeId];

    // 如果有国际化表，添加菜谱国际化关联
    if (hasI18nTable) {
      sql = sql.replace('FROM recipes r', 'FROM recipes r LEFT JOIN recipes_i18n r18n ON r.id = r18n.recipe_id AND r18n.language_code = ?');
      params.splice(1, 0, language); // 在language和recipeId之间插入language
    }

    const recipe = await db.prepare(sql).bind(...params).first();

    if (!recipe) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Recipe not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 查询关联的图片信息
    let imagePath = null;
    
    // 首先检查 recipes 表中是否有直接的 image_path 字段
    if (recipe.image_path) {
      imagePath = recipe.image_path;
    }
    // 如果没有直接的 image_path，则通过 image_id 关联查询
    else if (recipe.image_id) {
      const imageResult = await db.prepare(`
        SELECT image_path, expires_at 
        FROM recipe_images 
        WHERE id = ?
      `).bind(recipe.image_id).first();
      
      if (imageResult) {
        // 使用环境变量或默认域名
        const baseUrl = env.WORKER_URL || 'https://api.recipe-easy.com';
        imagePath = `${baseUrl}/images/${imageResult.image_path}`;
      }
    }

    // 根据菜谱ID映射到正确的slug
    const slugMap: Record<number, string> = {
      1: 'meat',
      2: 'seafood', 
      3: 'vegetables',
      4: 'fruits',
      5: 'dairy-eggs',
      6: 'grains-bread',
      7: 'nuts-seeds',
      8: 'herbs-spices',
      9: 'oils-condiments'
    };

    const formattedRecipe = {
      id: recipe.id,
      slug: recipe.slug || `recipe-${recipe.id}`,
      title: recipe.localized_title || recipe.title || `Recipe ${recipe.id}`,
      description: recipe.localized_description || recipe.description || `Description for Recipe ${recipe.id}`,
      imagePath: imagePath, // 从 recipe_images 表获取的图片URL
      ingredients: recipe.localized_ingredients || recipe.ingredients || [],
      seasoning: recipe.localized_seasoning || recipe.seasoning || [],
      instructions: recipe.localized_instructions || recipe.instructions || [],
      chefTips: recipe.localized_chef_tips || recipe.chef_tips || [],
      tags: recipe.localized_tags || recipe.tags || [],
      difficulty: recipe.localized_difficulty || recipe.difficulty || 'easy',
      cookingTime: recipe.cooking_time || 30, // 统一返回驼峰格式
      servings: recipe.servings || 4,
      cuisine: {
        id: recipe.cuisine_id || 1,
        slug: slugMap[Number(recipe.cuisine_id)] || 'other',
        name: recipe.localized_cuisine_name || recipe.cuisine_name || 'Other'
      },
      created_at: recipe.created_at,
      updated_at: recipe.updated_at
    };

    return new Response(JSON.stringify({
      success: true,
      recipe: formattedRecipe,
      language,
      source: 'database'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Single Recipe API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '获取菜谱数据失败',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 处理系统配置API
async function handleSystemConfigs(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const value = searchParams.get('value');

    if (!key) {
      return new Response(JSON.stringify({ error: 'Key is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'GET') {
      const config = await db.prepare(`
        SELECT * FROM system_configs WHERE key = ?
      `).bind(key).first();

      if (!config) {
        return new Response(JSON.stringify({ error: 'Config not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: config
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (request.method === 'POST') {
      if (!value) {
        return new Response(JSON.stringify({ error: 'Value is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const existingConfig = await db.prepare(`
        SELECT * FROM system_configs WHERE key = ?
      `).bind(key).first();

      if (existingConfig) {
        const updatedConfig = await db.prepare(`
          UPDATE system_configs SET value = ?, updated_at = DATETIME('now') WHERE key = ?
        `).bind(value, key).first();

        return new Response(JSON.stringify({
          success: true,
          message: `Config updated: ${key}`,
          data: updatedConfig
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        const newConfig = await db.prepare(`
          INSERT INTO system_configs (key, value, created_at, updated_at) VALUES (?, ?, DATETIME('now'), DATETIME('now'))
        `).bind(key, value).first();

        return new Response(JSON.stringify({
          success: true,
          message: `Config added: ${key}`,
          data: newConfig
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('System Configs API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process system configs request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 处理图片上传
async function handleUploadImage(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const body = await request.json();
    const { path, imageData, contentType, userId, recipeId, imageModel, sourceImageUrl, autoUpload } = body;
    
    // 参数验证 - 支持两种模式：base64上传或URL下载
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        details: 'userId is required'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 模式1：从URL自动下载（新的图片生成API）
    if (autoUpload && sourceImageUrl) {
      // 自动生成路径 - 需要recipeId来生成正确的路径
      if (!recipeId) {
        return new Response(JSON.stringify({ 
          error: 'Missing required parameters',
          details: 'recipeId is required for auto upload'
        }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const generatedPath = `${userId}/${recipeId}/${timestamp}-${randomString}.jpg`;
      
      try {
        // 下载图片
        const imageResponse = await fetch(sourceImageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.statusText}`);
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        const uint8Array = new Uint8Array(imageBuffer);
        
        // 上传到R2
        await env.RECIPE_IMAGES.put(generatedPath, uint8Array, {
          httpMetadata: {
            contentType: contentType || 'image/jpeg',
          },
          customMetadata: {
            userId,
            imageModel: imageModel || 'unknown',
            uploadedAt: new Date().toISOString()
          }
        });
        
        // 返回R2 URL
        const baseUrl = env.WORKER_URL || 'https://api.recipe-easy.com';
        const finalImageUrl = `${baseUrl}/images/${generatedPath}`;
        
        return new Response(JSON.stringify({ 
          success: true, 
          imageUrl: finalImageUrl,
          path: generatedPath
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Auto upload error:', error);
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Failed to download and upload image'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 模式2：传统的base64上传模式
    if (!path || !imageData || !recipeId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        details: 'For base64 upload: path, imageData, userId, and recipeId are required'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 验证base64数据格式
    try {
      // 1. 解码 base64 图片数据
      const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid base64 data',
        details: 'imageData must be valid base64 encoded string'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 1. 解码 base64 图片数据
    const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    
    // 2. 计算过期时间（暂时所有用户都7天过期）
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
    
    // 3. 上传到 R2
    await env.RECIPE_IMAGES.put(path, imageBuffer, {
      httpMetadata: {
        contentType: contentType || 'image/jpeg',
      },
              customMetadata: {
          userId,
          recipeId,
          imageModel: imageModel || 'unknown',
          expiresAt: expiresAt?.toISOString() || '',
          uploadedAt: new Date().toISOString()
        }
    });
    
    // 4. 保存到数据库
    const imageId = generateImageId();
    console.log('Saving image to database:', {
      imageId,
      userId,
      recipeId,
      path,
      imageModel,
      expiresAt: expiresAt?.toISOString()
    });
    
    try {
      const insertResult = await env.RECIPE_EASY_DB.prepare(`
        INSERT INTO recipe_images (
          id, user_id, recipe_id, image_path, expires_at, image_model, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        imageId,
        userId,
        recipeId,
        path,
        expiresAt?.toISOString() || null,
        imageModel || 'unknown',
        new Date().toISOString()
      ).run();
      
      console.log('Database insert result:', {
        success: insertResult.success,
        meta: insertResult.meta,
        error: insertResult.error
      });

      // 5. 更新菜谱表中的 image_id
      const updateResult = await env.RECIPE_EASY_DB.prepare(`
        UPDATE recipes SET image_id = ? WHERE id = ?
      `).bind(imageId, recipeId).run();
      
      console.log('Database update result:', {
        success: updateResult.success,
        meta: updateResult.meta,
        error: updateResult.error
      });
      
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // 即使数据库操作失败，也要返回图片URL，因为R2上传成功了
      console.log('R2 upload succeeded but database insert failed, returning image URL anyway');
    }
    
    // 5. 返回图片访问URL
    // 根据环境使用正确的域名
    const baseUrl = env.WORKER_URL || 'https://api.recipe-easy.com';
    const imageUrl = `${baseUrl}/images/${path}`;
    
    return new Response(JSON.stringify({ 
      success: true, 
      imageUrl,
      expiresAt: expiresAt?.toISOString() || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Upload image error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 数据转换工具函数
function normalizeRecipeForDatabase(recipe: any): any {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    cooking_time: recipe.cookingTime || recipe.cooking_time, // 优先使用驼峰格式
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients,
    seasoning: recipe.seasoning,
    instructions: recipe.instructions,
    tags: recipe.tags,
    chef_tips: recipe.chefTips || recipe.chef_tips, // 优先使用驼峰格式
    languageModel: recipe.languageModel,
    cuisineId: recipe.cuisineId || recipe.cuisine_id // 优先使用驼峰格式
  };
}

function normalizeRecipeForAPI(recipe: any): any {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    cookingTime: recipe.cooking_time || recipe.cookingTime, // 统一返回驼峰格式
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : JSON.parse(recipe.ingredients || '[]'),
    seasoning: Array.isArray(recipe.seasoning) ? recipe.seasoning : JSON.parse(recipe.seasoning || '[]'),
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions : JSON.parse(recipe.instructions || '[]'),
    tags: Array.isArray(recipe.tags) ? recipe.tags : JSON.parse(recipe.tags || '[]'),
    chefTips: Array.isArray(recipe.chef_tips) ? recipe.chef_tips : JSON.parse(recipe.chef_tips || '[]'), // 统一返回驼峰格式
    languageModel: recipe.languageModel || recipe.language_model,
    cuisineId: recipe.cuisine_id || recipe.cuisineId // 统一返回驼峰格式
  };
}

// 保存菜谱到数据库
async function handleSaveRecipe(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const body = await request.json();
    const { recipe, recipes, userId } = body;
    
    // 支持单个菜谱或菜谱数组，兼容两种数据格式
    let recipeArray;
    if (recipes) {
      recipeArray = Array.isArray(recipes) ? recipes : [recipes];
    } else if (recipe) {
      recipeArray = [recipe];
    } else {
      throw new Error('No recipe data provided');
    }
    
    const savedRecipes = [];
    let hasUpdatedImage = false;
    let alreadyExists = false;
    
    for (const recipe of recipeArray) {
      // 验证必要字段
      if (!recipe.id || !recipe.title) {
        throw new Error('Recipe ID and title are required');
      }
      
      // 调试信息
      console.log('保存菜谱数据:', {
        id: recipe.id,
        title: recipe.title,
        cuisineId: recipe.cuisineId,
        finalCuisineId: recipe.cuisineId || 9,
        imagePath: recipe.imagePath
      });
      
      // 检查菜谱是否已存在
      const existingRecipe = await env.RECIPE_EASY_DB.prepare(`
        SELECT r.id, r.image_id, ri.image_path as current_image_path 
        FROM recipes r 
        LEFT JOIN recipe_images ri ON r.image_id = ri.id 
        WHERE r.id = ?
      `).bind(recipe.id).first();
      
      if (existingRecipe) {
        alreadyExists = true;
        console.log(`Recipe already exists: ${recipe.id}`);
        
        // 检查图片是否有更新
        const hasNewImage = recipe.imagePath && recipe.imagePath !== existingRecipe.current_image_path;
        
        if (hasNewImage) {
          console.log(`Image updated for recipe ${recipe.id}: ${existingRecipe.current_image_path} -> ${recipe.imagePath}`);
          hasUpdatedImage = true;
          
          // 处理图片更新
          if (recipe.imagePath) {
            try {
              console.log(`Updating image for existing recipe: ${recipe.id}, imagePath: ${recipe.imagePath}`);
              
              // 下载新图片
              const imageResponse = await fetch(recipe.imagePath);
              if (!imageResponse.ok) {
                console.error(`Failed to download image: ${imageResponse.status}`);
              } else {
                const imageBuffer = await imageResponse.arrayBuffer();
                const uint8Array = new Uint8Array(imageBuffer);
                
                // 生成新的图片路径
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 15);
                const path = `${userId}/${recipe.id}/main.jpg`;
                
                // 删除旧图片（如果存在）
                if (existingRecipe.current_image_path) {
                  try {
                    await env.RECIPE_IMAGES.delete(String(existingRecipe.current_image_path));
                    console.log(`Deleted old image: ${existingRecipe.current_image_path}`);
                  } catch (deleteError) {
                    console.error('Failed to delete old image:', deleteError);
                  }
                }
                
                // 保存新图片到R2
                await env.RECIPE_IMAGES.put(path, uint8Array, {
                  httpMetadata: {
                    contentType: 'image/jpeg',
                  },
                  customMetadata: {
                    userId,
                    recipeId: recipe.id,
                    imageModel: recipe.imageModel || 'unknown',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    uploadedAt: new Date().toISOString()
                  }
                });
                
                // 更新recipe_images表
                if (existingRecipe.image_id) {
                  await env.RECIPE_EASY_DB.prepare(`
                    UPDATE recipe_images 
                    SET image_path = ?, image_model = ?, created_at = ?
                    WHERE id = ?
                  `).bind(
                    path,
                    recipe.imageModel || 'unknown',
                    new Date().toISOString(),
                    existingRecipe.image_id
                  ).run();
                } else {
                  // 创建新的图片记录
                  const imageId = generateImageId();
                  await env.RECIPE_EASY_DB.prepare(`
                    INSERT INTO recipe_images (
                      id, user_id, recipe_id, image_path, expires_at, image_model, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                  `).bind(
                    imageId,
                    userId,
                    recipe.id,
                    path,
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    recipe.imageModel || 'unknown',
                    new Date().toISOString()
                  ).run();
                  
                  // 更新菜谱的image_id
                  await env.RECIPE_EASY_DB.prepare(`
                    UPDATE recipes SET image_id = ? WHERE id = ?
                  `).bind(imageId, recipe.id).run();
                }
                
                console.log(`Image updated successfully for recipe: ${recipe.id}`);
              }
            } catch (error) {
              console.error(`Failed to update image for recipe ${recipe.id}:`, error);
            }
          }
        } else {
          console.log(`No image update needed for recipe ${recipe.id}`);
        }
        
        // 添加到已存在的菜谱列表（即使没有更新图片）
        savedRecipes.push(normalizeRecipeForDatabase(recipe));
        
        continue; // 跳过插入新菜谱的逻辑
      }
      
      // 插入新菜谱
      await env.RECIPE_EASY_DB.prepare(`
        INSERT INTO recipes (
          id, title, description, cooking_time, servings, difficulty, 
          ingredients, seasoning, instructions, tags, chef_tips, 
          language_model, user_id, cuisine_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        recipe.id,
        recipe.title,
        recipe.description,
        recipe.cookingTime || recipe.cooking_time,
        recipe.servings,
        recipe.difficulty,
        JSON.stringify(recipe.ingredients || []),
        JSON.stringify(recipe.seasoning || []),
        JSON.stringify(recipe.instructions || []),
        JSON.stringify(recipe.tags || []),
        JSON.stringify(recipe.chefTips || recipe.chef_tips || []),
        recipe.languageModel,
        userId,
        recipe.cuisineId || 9,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
      
      console.log(`Inserted new recipe: ${recipe.id}`);
      
      // 如果菜谱有图片，保存图片到R2和recipe_images表
      if (recipe.imagePath) {
        try {
          console.log(`Saving image for recipe: ${recipe.id}, imagePath: ${recipe.imagePath}`);
          
          // 下载图片
          const imageResponse = await fetch(recipe.imagePath);
          if (!imageResponse.ok) {
            console.error(`Failed to download image: ${imageResponse.status}`);
          } else {
            const imageBuffer = await imageResponse.arrayBuffer();
            
            // 直接使用ArrayBuffer
            const uint8Array = new Uint8Array(imageBuffer);
            
            // 生成正确的图片路径：userId/recipeId/imageName
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const path = `${userId}/${recipe.id}/${timestamp}-${randomString}.jpg`;
            
            // 保存到R2
            await env.RECIPE_IMAGES.put(path, uint8Array, {
              httpMetadata: {
                contentType: 'image/jpeg',
              },
              customMetadata: {
                userId,
                recipeId: recipe.id,
                imageModel: recipe.imageModel || 'unknown',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                uploadedAt: new Date().toISOString()
              }
            });
            
            // 保存到recipe_images表
            const imageId = generateImageId();
            await env.RECIPE_EASY_DB.prepare(`
              INSERT INTO recipe_images (
                id, user_id, recipe_id, image_path, expires_at, image_model, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
              imageId,
              userId,
              recipe.id,
              path,
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              recipe.imageModel || 'unknown',
              new Date().toISOString()
            ).run();
            
            // 更新菜谱的image_id
            await env.RECIPE_EASY_DB.prepare(`
              UPDATE recipes SET image_id = ? WHERE id = ?
            `).bind(imageId, recipe.id).run();
            
            console.log(`Image saved successfully for recipe: ${recipe.id}`);
          }
        } catch (error) {
          console.error(`Failed to save image for recipe ${recipe.id}:`, error);
        }
      }
      
      // 添加到保存的菜谱列表
      savedRecipes.push(normalizeRecipeForDatabase(recipe));
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      recipes: savedRecipes,
      count: savedRecipes.length,
      alreadyExists,
      hasUpdatedImage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Save recipe error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save recipe',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 自动清理过期图片
async function cleanupExpiredImages(env: Env): Promise<void> {
  try {
    // 1. 查找过期的图片记录
    const expiredImages = await env.RECIPE_EASY_DB.prepare(`
      SELECT id, image_path FROM recipe_images 
      WHERE expires_at IS NOT NULL AND expires_at < ?
    `).bind(new Date().toISOString()).all();
    
    // 2. 从 R2 删除过期图片
    for (const image of expiredImages.results) {
      try {
        const imagePath = image.image_path as string;
        await env.RECIPE_IMAGES.delete(imagePath);
        console.log(`Deleted expired image: ${imagePath}`);
      } catch (error) {
        console.error(`Failed to delete image ${image.image_path}:`, error);
      }
    }
    
    // 3. 从数据库删除过期记录
    await env.RECIPE_EASY_DB.prepare(`
      DELETE FROM recipe_images 
      WHERE expires_at IS NOT NULL AND expires_at < ?
    `).bind(new Date().toISOString()).run();
    
    // 4. 更新菜谱表中的图片关联（将过期的图片关联设为NULL）
    await env.RECIPE_EASY_DB.prepare(`
      UPDATE recipes 
      SET image_id = NULL 
      WHERE image_id IN (
        SELECT ri.id FROM recipe_images ri 
        WHERE ri.expires_at IS NOT NULL AND ri.expires_at < ?
      )
    `).bind(new Date().toISOString()).run();
    
    console.log(`Cleaned up ${expiredImages.results.length} expired images`);
    
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// 获取用户菜谱列表
async function handleGetUserRecipes(request: Request, db: D1Database, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1]; // 获取最后一个部分作为用户ID
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // 获取总数
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM recipes WHERE user_id = ?
    `).bind(userId).first();
    
    // 获取菜谱列表（包含图片信息）
    const recipesResult = await db.prepare(`
      SELECT r.*, ri.image_path, ri.expires_at as image_expires_at, ri.image_model
      FROM recipes r
      LEFT JOIN recipe_images ri ON r.image_id = ri.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all();
    
    // 格式化菜谱数据
    const recipes = recipesResult.results.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      cookingTime: row.cooking_time, 
      servings: row.servings,
      difficulty: row.difficulty,
      ingredients: JSON.parse(row.ingredients || '[]'),
      seasoning: JSON.parse(row.seasoning || '[]'),
      instructions: JSON.parse(row.instructions || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      chefTips: JSON.parse(row.chef_tips || '[]'), // 修正字段名
      imagePath: row.image_path ? `${env.WORKER_URL || 'https://api.recipe-easy.com'}/images/${row.image_path}` : null,
      imageExpiresAt: row.image_expires_at,
      languageModel: row.language_model,
      imageModel: row.image_model,
      createdAt: row.created_at
    }));
    
    return new Response(JSON.stringify({ 
      results: recipes,
      total: countResult.total,
      page,
      limit
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get user recipes error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch user recipes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 删除菜谱
async function handleDeleteRecipe(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const recipeId = pathParts[pathParts.length - 1]; // 获取最后一个部分作为菜谱ID
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 获取菜谱信息
    const recipeResult = await env.RECIPE_EASY_DB.prepare(`
      SELECT r.user_id, ri.image_path 
      FROM recipes r
      LEFT JOIN recipe_images ri ON r.image_id = ri.id
      WHERE r.id = ? AND r.user_id = ?
    `).bind(recipeId, userId).first();
    
    if (!recipeResult) {
      return new Response(JSON.stringify({ error: 'Recipe not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 删除 R2 中的图片
    if (recipeResult.image_path) {
      try {
        const imagePath = recipeResult.image_path as string;
        await env.RECIPE_IMAGES.delete(imagePath);
        console.log(`Deleted image from R2: ${imagePath}`);
      } catch (error) {
        console.error('Failed to delete image from R2:', error);
      }
    }
    
    // 删除数据库记录
    await env.RECIPE_EASY_DB.prepare(`
      DELETE FROM recipes WHERE id = ? AND user_id = ?
    `).bind(recipeId, userId).run();
    
    await env.RECIPE_EASY_DB.prepare(`
      DELETE FROM recipe_images WHERE recipe_id = ? AND user_id = ?
    `).bind(recipeId, userId).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Recipe deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Delete recipe error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete recipe',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export default worker;