import { D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  RECIPE_EASY_DB: D1Database;
  RECIPE_IMAGES: R2Bucket;
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
        return await handleCategories(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      
      if (path === '/api/ingredients') {
        return await handleIngredients(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      
      if (path === '/api/cuisines') {
        return await handleCuisines(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      
      if (path === '/api/user-usage') {
        return await handleUserUsage(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      
      if (path === '/api/recipes') {
        return await handleRecipes(request, env.RECIPE_EASY_DB, corsHeaders);
      }

      if (path === '/api/admin/add-columns') {
        return await handleAddColumns(request, env.RECIPE_EASY_DB, corsHeaders);
      }

      if (path === '/api/system-configs') {
        return await handleSystemConfigs(request, env.RECIPE_EASY_DB, corsHeaders);
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
        c.slug,
        c18n.name as cuisine_name
      FROM cuisines c
      LEFT JOIN cuisines_i18n c18n ON c.id = c18n.cuisine_id AND c18n.language_code = ?
      ORDER BY c.id ASC
    `).bind(language).all();

    const cuisines = results || [];
    const formattedCuisines = cuisines.map((cuisine: any) => {
      return {
        id: cuisine.id,
        slug: cuisine.slug || `cuisine-${cuisine.id}`,
        name: cuisine.cuisine_name || `Cuisine ${cuisine.id}`
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
        const newCredits = await db.prepare(`
          INSERT INTO user_credits (user_id, credits, total_earned, total_spent, created_at, updated_at)
          VALUES (?, ?, ?, 0, DATETIME('now'), DATETIME('now'))
          RETURNING *
        `).bind(userId, initialCredits, initialCredits).first();

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
        const transaction = await db.prepare(`
          INSERT INTO credit_transactions (user_id, type, amount, reason, description, created_at)
          VALUES (?, 'spend', ?, 'generation', ?, DATETIME('now'))
          RETURNING *
        `).bind(userId, generationCost, description || `Generated a recipe for ${generationCost} credits.`).first();

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
        const transaction = await db.prepare(`
          INSERT INTO credit_transactions (user_id, type, amount, reason, description, created_at)
          VALUES (?, 'earn', ?, 'manual', ?, DATETIME('now'))
          RETURNING *
        `).bind(userId, earnAmount, description || `Manually earned ${earnAmount} credits.`).first();

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
async function handleRecipes(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const cuisineId = searchParams.get('cuisineId');
    const language = searchParams.get('lang') || 'en';

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

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await db.prepare(sql).bind(...params).all();
    const recipes = results || [];

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
      
      return {
        id: recipe.id,
        slug: recipe.slug || `recipe-${recipe.id}`,
        title: recipe.localized_title || recipe.title || `Recipe ${recipe.id}`,
        description: recipe.localized_description || recipe.description || `Description for Recipe ${recipe.id}`,
        image_url: recipe.image_url || `https://recipe-easy.annnb016.workers.dev/images/recipe-${recipe.id}.jpg`,
        ingredients: recipe.localized_ingredients || recipe.ingredients || [],
        seasoning: recipe.localized_seasoning || recipe.seasoning || [],
        instructions: recipe.localized_instructions || recipe.instructions || [],
        chef_tips: recipe.localized_chef_tips || recipe.chef_tips || [],
        tags: recipe.localized_tags || recipe.tags || [],
        difficulty: recipe.localized_difficulty || recipe.difficulty || 'easy',
        cook_time: recipe.cook_time || 30,
        servings: recipe.servings || 4,
        cuisine: {
          id: recipe.cuisine_id || 1,
          slug: slugMap[recipe.cuisine_id] || 'other',
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
    const { tableName, columnName, columnType } = body;

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

export default worker;