import { D1Database, R2Bucket, ExecutionContext } from '@cloudflare/workers-types';
import { 
  generateImageId,
  generateTransactionId,
  createCorsHeaders,
  validatePaginationParams, 
  validateSearchParam, 
  validateUserId, 
  validateRecipeId,
  createSuccessResponse,
  createErrorResponse,
  createHealthResponse,
  createRootResponse,
  createNotFoundResponse,
  getContentType,
  generateSafeImagePath,
  downloadImageFromUrl,
  uploadImageToR2,
  saveImageRecord,
  deleteImageFromR2,
  getSystemConfig,
  normalizeRecipeForDatabase,
  formatCuisine,
  formatCategory,
  formatIngredient,
} from '../lib/utils';

export interface Env {
  RECIPE_EASY_DB: D1Database;
  RECIPE_IMAGES: R2Bucket;
  WORKER_URL?: string;
  QWENPLUS_API_KEY?: string;
  DASHSCOPE_API_KEY?: string;
  REPLICATE_API_TOKEN?: string;
}

// 记录模型使用情况
async function recordModelUsage(db: D1Database, params: {
  model_name: string;
  model_type: 'language' | 'image';
  model_response_id: string;               // 大模型返回的ID
  request_details?: string;
}): Promise<void> {
  try {
    const stmt = db.prepare(`
      INSERT INTO model_usage_records (id, model_name, model_type, request_details, created_at)
      VALUES (?, ?, ?, ?, DATETIME('now'))
    `);
    await stmt.bind(
      params.model_response_id,            // 使用大模型返回的ID作为主键
      params.model_name,
      params.model_type,
      params.request_details || null
    ).run();
  } catch (error) {
    console.error('❌ Failed to record model usage:', error);
    // 不抛出错误，避免影响主要业务逻辑
  }
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 设置CORS头和安全头
    const corsHeaders = createCorsHeaders();
    
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 健康检查路由
      if (path === '/health' || path === '/api/health') {
        return createHealthResponse();
      }

      // 根路径
      if (path === '/') {
        return createRootResponse();
      }

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
      
      if (path === '/api/model-usage') {
        if (request.method === 'POST') {
          return await handleModelUsage(request, env.RECIPE_EASY_DB, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }
      
      // 公开菜谱接口 - 无需权限 (已合并到 /api/recipes)
      if (path === '/api/recipes/public') {
        if (request.method === 'GET') {
          return await handlePublicRecipes(request, env.RECIPE_EASY_DB, env, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }

      // 管理员菜谱接口 - 需要管理员权限
      if (path === '/api/recipes/admin') {
        if (request.method === 'GET') {
          return await handleAdminRecipes(request, env.RECIPE_EASY_DB, env, corsHeaders);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }

      // 保留原有接口用于向后兼容，但建议迁移到新接口
      if (path === '/api/recipes') {
        if (request.method === 'GET') {
          return await handlePublicRecipes(request, env.RECIPE_EASY_DB, env, corsHeaders);
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
          return await handleSaveRecipe(request, env, corsHeaders, ctx);
        } else {
          return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
          });
        }
      }


      if (path === '/api/test') {
        return new Response(JSON.stringify({ 
          message: 'Test endpoint reached',
          path: path,
          method: request.method,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 测试管理员配置
      if (path === '/api/test-admin-config') {
        try {
          const adminConfig = await env.RECIPE_EASY_DB.prepare(`
            SELECT value FROM system_configs WHERE key = 'admin_id'
          `).first();
          
          return new Response(JSON.stringify({
            success: true,
            adminConfig: adminConfig,
            hasAdminId: !!adminConfig?.value,
            adminId: adminConfig?.value || null
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to check admin config',
            details: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // 处理单个菜谱的API路由 /api/recipes/[id] - 根据HTTP方法区分操作
      if (path.startsWith('/api/recipes/') && path !== '/api/recipes' && !path.startsWith('/api/recipes/user/') && path !== '/api/recipes/admin') {
        if (request.method === 'DELETE') {
          return await handleDeleteRecipe(request, env, corsHeaders);
        } else {
          return await handleSingleRecipe(request, env.RECIPE_EASY_DB, env, corsHeaders);
        }
      }

      // 测试数据库连接
      if (path === '/api/test-db-simple') {
        try {
          const result = await env.RECIPE_EASY_DB.prepare(`
            SELECT COUNT(*) as count FROM recipes
          `).first();
          
          return new Response(JSON.stringify({
            success: true,
            recipeCount: result?.count,
            message: 'Database connection successful'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Database connection failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
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
      return createErrorResponse('Image path is required', 400, undefined, corsHeaders);
    }

    // 从R2存储桶获取图片
    const object = await bucket.get(imagePath);
    
    if (!object) {
      return createNotFoundResponse(corsHeaders);
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
    return createErrorResponse('Failed to serve image', 500, undefined, corsHeaders);
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
        COALESCE(c18n.name, c.name) as category_name
      FROM ingredient_categories c
      LEFT JOIN ingredient_categories_i18n c18n ON c.id = c18n.category_id AND c18n.language_code = ?
      ORDER BY c.id ASC
    `).bind(language).all();

    const categories = results || [];
    const formattedCategories = categories.map(formatCategory);

    return createSuccessResponse(formattedCategories, {
      total: formattedCategories.length,
      language,
      source: 'database',
      corsHeaders
    });

  } catch (error) {
    console.error('Categories API error:', error);
    return createErrorResponse(
      '获取分类数据失败',
      500,
      error instanceof Error ? error.message : '未知错误',
      corsHeaders
    );
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

    const formattedIngredients = ingredients.map(formatIngredient);

    return createSuccessResponse(formattedIngredients, {
      total: formattedIngredients.length,
      limit,
      offset,
      language,
      source: 'database',
      corsHeaders
    });
      
  } catch (error) {
    console.error('Ingredients API error:', error);
    return createErrorResponse(
      '获取食材数据失败',
      500,
      error instanceof Error ? error.message : '未知错误',
      corsHeaders
    );
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
        c.slug as cuisine_slug,
        c.css_class,
        COALESCE(c18n.name, c.name) as localized_cuisine_name,
        COALESCE(c18n.slug, c.slug) as localized_cuisine_slug
      FROM cuisines c
      LEFT JOIN cuisines_i18n c18n ON c.id = c18n.cuisine_id AND c18n.language_code = ?
      ORDER BY c.id ASC
    `).bind(language).all();

    const cuisines = results || [];
    const formattedCuisines = cuisines.map(formatCuisine);

    return createSuccessResponse(formattedCuisines, {
      total: formattedCuisines.length,
      language,
      source: 'database',
      corsHeaders
    });

  } catch (error) {
    console.error('Cuisines API error:', error);
    return createErrorResponse(
      '获取菜系数据失败',
      500,
      error instanceof Error ? error.message : '未知错误',
      corsHeaders
    );
  }
}

// 处理用户积分API
async function handleUserUsage(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    console.log('🔍 handleUserUsage called with method:', request.method);

    if (request.method === 'GET') {
      // GET请求：从URL参数获取并验证userId
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    const rawIsAdmin = searchParams.get('isAdmin');
    
      console.log('🔍 GET request params:', { rawUserId, rawIsAdmin });
    
    // 🔒 安全修复：使用validateUserId函数验证用户ID
    const userValidation = validateUserId(rawUserId);
    if (!userValidation.isValid) {
        console.log('❌ GET User ID validation failed:', userValidation.error);
      return createErrorResponse(userValidation.error || 'Invalid user ID', 400, undefined, corsHeaders);
    }
    
    const userId = userValidation.userId!;
    const isAdmin = rawIsAdmin === 'true';
      console.log('✅ GET User ID validation passed:', userId);
      if (!userId) {
        return createErrorResponse('User ID is required', 400, undefined, corsHeaders);
      }

      // 检查表是否存在
      const tableExists = await db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='user_credits'
      `).first();
      
      if (!tableExists) {
        console.log('❌ user_credits table does not exist');
        return createErrorResponse('Database setup required: user_credits table missing', 500, 'user_credits table not found', corsHeaders);
      }

      // 获取用户积分
      const userCredits = await db.prepare(`
        SELECT * FROM user_credits WHERE user_id = ?
      `).bind(userId).first();

      console.log('🔍 User credits query result:', { userId, userCredits: userCredits ? 'found' : 'not found' });

      if (!userCredits) {
        // 从系统配置中获取初始积分
        const initialCredits = await getSystemConfig(db, 'initial_credits', 100);
        console.log('🔧 Creating new user credits record with initial credits:', initialCredits);
        
        // 创建新用户积分记录
        const creditId = generateTransactionId();
        const newCredits = await db.prepare(`
          INSERT INTO user_credits (id, user_id, credits, total_earned, total_spent, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, DATETIME('now'), DATETIME('now'))
          RETURNING *
        `).bind(creditId, userId, initialCredits, initialCredits).first();

        console.log('✅ New user credits record created:', newCredits);

        return createSuccessResponse({
          credits: newCredits,
          canGenerate: true,
          availableCredits: initialCredits,
        }, { corsHeaders });
      }

      // 检查是否可以生成
      const adminUnlimited = await getSystemConfig(db, 'admin_unlimited', true);
      const canGenerate = (isAdmin && adminUnlimited) || (userCredits.credits as number) > 0;

      console.log('🔍 User can generate:', { isAdmin, adminUnlimited, userCredits: userCredits.credits, canGenerate });

      return createSuccessResponse({
        credits: userCredits,
        canGenerate,
        availableCredits: userCredits.credits,
      }, { corsHeaders });

    } else if (request.method === 'POST') {
      const body = await request.json();
      const { userId: bodyUserId, action, amount, description } = body;

      console.log('🔍 POST request body:', { bodyUserId, action, amount, description });

      // 🔒 安全修复：使用validateUserId函数验证POST请求中的用户ID
      const userValidation = validateUserId(bodyUserId);
      if (!userValidation.isValid) {
        console.log('❌ POST request user ID validation failed:', userValidation.error);
        return createErrorResponse(userValidation.error || 'Invalid user ID', 400, undefined, corsHeaders);
      }
      
      const userId = userValidation.userId!;
      console.log('✅ POST request user ID validation passed:', userId);

      if (action === 'spend') {
        // 从系统配置中获取生成消耗
        const generationCost = amount || await getSystemConfig(db, 'generation_cost', 1);
        console.log('🔍 Spending credits:', { userId, generationCost });
        
        // 检查表是否存在
        const tableExists = await db.prepare(`
          SELECT name FROM sqlite_master WHERE type='table' AND name='user_credits'
        `).first();
        
        if (!tableExists) {
          console.log('❌ user_credits table does not exist for POST request');
          return createErrorResponse('Database setup required: user_credits table missing', 500, 'user_credits table not found', corsHeaders);
        }
        
        // 消费积分
        const userCredits = await db.prepare(`
          SELECT * FROM user_credits WHERE user_id = ?
        `).bind(userId).first();

        console.log('🔍 User credits before spending:', { userId, userCredits: userCredits ? userCredits.credits : 'not found' });

        if (!userCredits || userCredits.credits < generationCost) {
          console.log('❌ Insufficient credits:', { userId, available: userCredits?.credits, required: generationCost });
          return createErrorResponse('Insufficient credits.', 400, undefined, corsHeaders);
        }

        try {
          const updatedCredits = await db.prepare(`
            UPDATE user_credits 
            SET credits = credits - ?, total_spent = total_spent + ?, updated_at = DATETIME('now')
            WHERE user_id = ?
            RETURNING *
          `).bind(generationCost, generationCost, userId).first();

          console.log('✅ Credits updated successfully:', updatedCredits);

          // 记录交易
          const transactionId = generateTransactionId();
          const transaction = await db.prepare(`
            INSERT INTO credit_transactions (id, user_id, type, amount, reason, description, created_at)
            VALUES (?, ?, 'spend', ?, 'generation', ?, DATETIME('now'))
            RETURNING *
          `).bind(transactionId, userId, generationCost, description || `Generated a recipe for ${generationCost} credits.`).first();

          console.log('✅ Transaction recorded:', transaction);

          return createSuccessResponse({
            success: true,
            message: `Successfully spent ${generationCost} credits.`,
            data: { credits: updatedCredits, transactionId: transaction.id }
          }, { corsHeaders });

        } catch (dbError) {
          console.error('❌ Database error during credit update:', dbError);
          return createErrorResponse('Database error during credit update', 500, dbError instanceof Error ? dbError.message : 'Unknown database error', corsHeaders);
        }

      } else if (action === 'earn') {
        const earnAmount = amount || 0;
        console.log('🔍 Earning credits:', { userId, earnAmount });
        
        if (earnAmount <= 0) {
          return createErrorResponse('Earn amount must be positive', 400, undefined, corsHeaders);
        }

        // 检查用户积分记录是否存在
        let userCredits = await db.prepare(`
          SELECT * FROM user_credits WHERE user_id = ?
        `).bind(userId).first();

        if (!userCredits) {
          // 创建新用户积分记录
          const creditId = generateTransactionId();
          userCredits = await db.prepare(`
            INSERT INTO user_credits (id, user_id, credits, total_earned, total_spent, created_at, updated_at)
            VALUES (?, ?, ?, ?, 0, DATETIME('now'), DATETIME('now'))
            RETURNING *
          `).bind(creditId, userId, earnAmount, earnAmount).first();
        } else {
          // 更新现有记录
          userCredits = await db.prepare(`
            UPDATE user_credits 
            SET credits = credits + ?, total_earned = total_earned + ?, updated_at = DATETIME('now')
            WHERE user_id = ?
            RETURNING *
          `).bind(earnAmount, earnAmount, userId).first();
        }

        // 记录交易
        const transactionId = generateTransactionId();
        const transaction = await db.prepare(`
          INSERT INTO credit_transactions (id, user_id, type, amount, reason, description, created_at)
          VALUES (?, ?, 'earn', ?, 'earned', ?, DATETIME('now'))
          RETURNING *
        `).bind(transactionId, userId, earnAmount, description || `Earned ${earnAmount} credits.`).first();

        return createSuccessResponse({
          success: true,
          message: `Successfully earned ${earnAmount} credits.`,
          data: { credits: userCredits, transactionId: transaction.id }
        }, { corsHeaders });
      }

      return createErrorResponse('Invalid action', 400, undefined, corsHeaders);
    }

    return createErrorResponse('Method not allowed', 405, undefined, corsHeaders);
      
  } catch (error) {
    console.error('❌ User usage API error:', error);
    return createErrorResponse('Failed to process user usage request', 500, error instanceof Error ? error.message : 'Unknown error', corsHeaders);
  }
}

// 处理菜谱API
async function handlePublicRecipes(request: Request, db: D1Database, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    
    // 参数验证和限制
    const { limit, offset } = validatePaginationParams(
      searchParams.get('limit'), 
      searchParams.get('offset')
    );
    
    const search = validateSearchParam(searchParams.get('search'));
    const cuisineId = searchParams.get('cuisineId');
    const language = searchParams.get('lang') || 'en';

    // 获取管理员用户ID
    const adminConfig = await db.prepare(`
      SELECT value FROM system_configs WHERE key = 'admin_id'
    `).first();
    const adminUserId = adminConfig?.value;

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

    // 构建查询：管理员菜谱 + 根据语言查询的菜谱
    let sql = `
      SELECT DISTINCT r.id, r.title, r.description, r.cooking_time, r.servings, r.difficulty,
        r.ingredients, r.seasoning, r.instructions, r.tags, r.chef_tips,
        r.cuisine_id, r.user_id, r.created_at, r.updated_at,
        c.name as cuisine_name,
        c.css_class,
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
    
    // 如果有国际化表，添加菜谱国际化关联
    if (hasI18nTable) {
      sql += ` LEFT JOIN recipes_i18n r18n ON r.id = r18n.recipe_id AND r18n.language_code = ?`;
    }

    const params: any[] = [language];
    if (hasI18nTable) {
      params.push(language);
    }

    // 构建查询条件
    const conditions: string[] = [];
    
    // 搜索条件
    const validatedSearch = validateSearchParam(search);
    if (validatedSearch) {
      conditions.push('(r.title LIKE ? OR r.description LIKE ?)');
      params.push(`%${validatedSearch}%`, `%${validatedSearch}%`);
    }

    // 菜系过滤
    if (cuisineId) {
      const cuisineIdInt = parseInt(cuisineId);
      if (!isNaN(cuisineIdInt)) {
        conditions.push('r.cuisine_id = ?');
        params.push(cuisineIdInt);
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    } else {
      // 如果没有其他条件，查询所有菜谱
      sql += ' WHERE 1=1';
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
      
    const { results } = await db.prepare(sql).bind(...params).all();
    const recipes = results || [];

    // 获取所有菜谱的图片信息
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
      // 根据菜系ID映射到正确的slug
      const slugMap: Record<number, string> = {
        1: 'chinese',
        2: 'italian', 
        3: 'french',
        4: 'indian',
        5: 'japanese',
        6: 'mediterranean',
        7: 'thai',
        8: 'mexican',
        9: 'others'
      };
      
      // 使用关联查询的结果获取图片路径
      let imagePath = imageMap[recipe.id] || null;
      
      // 使用翻译后的字段（如果存在）或原字段
      const getLocalizedField = (localizedField: any, originalField: any) => {
        return localizedField !== undefined && localizedField !== null ? localizedField : originalField;
      };
      
      const parseJsonField = (field: any) => {
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch {
            return [];
          }
        }
        return Array.isArray(field) ? field : [];
      };
      
      return {
        id: recipe.id,
        title: hasI18nTable ? getLocalizedField(recipe.localized_title, recipe.title) : (recipe.title || `Recipe ${recipe.id}`),
        description: hasI18nTable ? getLocalizedField(recipe.localized_description, recipe.description) : (recipe.description || `Description for Recipe ${recipe.id}`),
        imagePath: imagePath, // 从 recipe_images 表获取的图片URL
        ingredients: parseJsonField(hasI18nTable ? getLocalizedField(recipe.localized_ingredients, recipe.ingredients) : recipe.ingredients),
        seasoning: parseJsonField(hasI18nTable ? getLocalizedField(recipe.localized_seasoning, recipe.seasoning) : recipe.seasoning),
        instructions: parseJsonField(hasI18nTable ? getLocalizedField(recipe.localized_instructions, recipe.instructions) : recipe.instructions),
        chefTips: parseJsonField(hasI18nTable ? getLocalizedField(recipe.localized_chef_tips, recipe.chef_tips) : recipe.chef_tips),
        tags: parseJsonField(hasI18nTable ? getLocalizedField(recipe.localized_tags, recipe.tags) : recipe.tags),
        difficulty: hasI18nTable ? getLocalizedField(recipe.localized_difficulty, recipe.difficulty) : (recipe.difficulty || 'easy'),
        cookingTime: recipe.cooking_time || 30, // 统一返回驼峰格式
        servings: recipe.servings || 4,
        user_id: recipe.user_id, // 添加用户ID
        cuisine: {
          id: recipe.cuisine_id || 1,
          slug: slugMap[Number(recipe.cuisine_id)] || 'other',
          name: recipe.localized_cuisine_name || recipe.cuisine_name || 'Other',
          cssClass: recipe.css_class || 'cuisine-other'
        },
        created_at: recipe.created_at,
        updated_at: recipe.updated_at
      }
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
    console.error('Error in handlePublicRecipes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch recipes',
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
        r.id, r.title, r.description, r.cooking_time, r.servings, r.difficulty,
        r.ingredients, r.seasoning, r.instructions, r.tags, r.chef_tips,
        r.cuisine_id, r.user_id, r.created_at, r.updated_at,
          c.name as cuisine_name,
          c.css_class,
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
    
    // 通过 recipe_id 关联查询图片路径
    const imageResult = await db.prepare(`
      SELECT image_path, expires_at 
      FROM recipe_images 
      WHERE recipe_id = ?
    `).bind(recipe.id).first();
    
    if (imageResult) {
      // 使用环境变量或默认域名
      const baseUrl = env.WORKER_URL || 'https://api.recipe-easy.com';
      imagePath = `${baseUrl}/images/${imageResult.image_path}`;
    }

    // 根据菜系ID映射到正确的slug
    const slugMap: Record<number, string> = {
      1: 'chinese',
      2: 'italian', 
      3: 'french',
      4: 'indian',
      5: 'japanese',
      6: 'mediterranean',
      7: 'thai',
      8: 'mexican',
      9: 'others'
    };

    // 解析JSON字符串为数组的辅助函数
    const parseJsonArray = (data: any): any[] => {
      if (Array.isArray(data)) return data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          return [];
        }
      }
      return [];
    };

    const formattedRecipe = {
      id: recipe.id,
      title: recipe.localized_title || recipe.title,
      description: recipe.localized_description || recipe.description,
      imagePath: imagePath, // 从 recipe_images 表获取的图片URL
      ingredients: parseJsonArray(recipe.localized_ingredients || recipe.ingredients),
      seasoning: parseJsonArray(recipe.localized_seasoning || recipe.seasoning),
      instructions: parseJsonArray(recipe.localized_instructions || recipe.instructions),
      chefTips: parseJsonArray(recipe.localized_chef_tips || recipe.chef_tips),
      tags: parseJsonArray(recipe.localized_tags || recipe.tags),
      difficulty: recipe.localized_difficulty || recipe.difficulty || 'easy',
      cookingTime: recipe.cooking_time || 30, // 统一返回驼峰格式
      servings: recipe.servings || 4,
      cuisine: {
        id: recipe.cuisine_id || 1,
        slug: slugMap[Number(recipe.cuisine_id)] || 'other',
        name: recipe.localized_cuisine_name || recipe.cuisine_name || 'Other',
        cssClass: recipe.css_class || 'cuisine-other'
      },
      created_at: recipe.created_at,
      updated_at: recipe.updated_at
    };

    // 基于菜谱标题检测实际语言
    const hasChineseChars = /[\u4e00-\u9fff]/.test(String(formattedRecipe.title));
    const detectedLanguage = hasChineseChars ? 'zh' : 'en';

    return new Response(JSON.stringify({
      success: true,
      recipe: formattedRecipe,
      language: detectedLanguage,
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
      
      // 🔒 安全修复：验证用户是否有权限访问该菜谱
      const recipeCheck = await env.RECIPE_EASY_DB.prepare(`
        SELECT user_id FROM recipes WHERE id = ?
      `).bind(recipeId).first();
      
      if (!recipeCheck || recipeCheck.user_id !== userId) {
        return new Response(JSON.stringify({ 
          error: 'Access denied',
          details: 'You do not have permission to upload images for this recipe'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // 🔒 安全修复：服务器端生成安全的文件路径
      const timestamp = Date.now();
      const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
      const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '');
      const sanitizedRecipeId = recipeId.toString().replace(/[^a-zA-Z0-9-_]/g, '');
      const generatedPath = `${sanitizedUserId}/${sanitizedRecipeId}/${timestamp}-${randomString}.jpg`;
      
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
    if (!imageData || !recipeId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        details: 'For base64 upload: imageData, userId, and recipeId are required'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 🔒 安全修复：验证用户是否有权限访问该菜谱
    const recipeCheck = await env.RECIPE_EASY_DB.prepare(`
      SELECT user_id FROM recipes WHERE id = ?
    `).bind(recipeId).first();
    
    if (!recipeCheck || recipeCheck.user_id !== userId) {
      return new Response(JSON.stringify({ 
        error: 'Access denied',
        details: 'You do not have permission to upload images for this recipe'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 🔒 安全修复：服务器端生成安全的文件路径，忽略客户端提供的path
    const timestamp = Date.now();
    const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedRecipeId = recipeId.toString().replace(/[^a-zA-Z0-9-_]/g, '');
    const safePath = `${sanitizedUserId}/${sanitizedRecipeId}/${timestamp}-${randomString}.jpg`;
    
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
    await env.RECIPE_IMAGES.put(safePath, imageBuffer, {
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
    
    try {
      const insertResult = await env.RECIPE_EASY_DB.prepare(`
        INSERT INTO recipe_images (
          id, user_id, recipe_id, image_path, expires_at, image_model, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        imageId,
        userId,
        recipeId,
        safePath,
        expiresAt?.toISOString() || null,
        imageModel || 'unknown',
        new Date().toISOString()
      ).run();
      

      // 5. 更新菜谱表中的 image_id (已移除，因为该列不存在)
      
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // 即使数据库操作失败，也要返回图片URL，因为R2上传成功了
    }
    
    // 5. 返回图片访问URL
    // 根据环境使用正确的域名
    const baseUrl = env.WORKER_URL || 'https://api.recipe-easy.com';
    const imageUrl = `${baseUrl}/images/${safePath}`;
    
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

// 异步翻译菜谱
async function triggerRecipeTranslation(recipe: any, targetLanguage: string, db: D1Database, env: Env): Promise<void> {
  try {
    // 使用翻译服务进行翻译
    const { translateRecipeAsync } = await import('../lib/services/translation');
    await translateRecipeAsync(recipe, targetLanguage, db, env);
  } catch (error) {
    console.error(`❌ Recipe translation failed for ${recipe.id} to ${targetLanguage}:`, error);
    // 不抛出错误，避免影响主要业务逻辑
  }
}

// 保存菜谱到数据库
async function handleSaveRecipe(request: Request, env: Env, corsHeaders: Record<string, string>, ctx: ExecutionContext): Promise<Response> {
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
    const newlySavedRecipes = []; // 记录新保存的菜谱，用于后续翻译
    
    for (const recipe of recipeArray) {
      // 验证必要字段
      if (!recipe.id || !recipe.title) {
        throw new Error('Recipe ID and title are required');
      }

      // 检查菜谱是否已存在
      const existingRecipe = await env.RECIPE_EASY_DB.prepare(`
        SELECT r.id, ri.id as image_id, ri.image_path as current_image_path 
        FROM recipes r 
        LEFT JOIN recipe_images ri ON r.id = ri.recipe_id 
        WHERE r.id = ?
      `).bind(recipe.id).first();
      
      if (existingRecipe) {
        alreadyExists = true;
        
        // 检查图片是否有更新
        const hasNewImage = recipe.imagePath && recipe.imagePath !== existingRecipe.current_image_path;
        
        if (hasNewImage) {
          hasUpdatedImage = true;
          
          // 处理图片更新
          if (recipe.imagePath) {
            try {
              // 生成安全的图片路径
              const path = generateSafeImagePath(userId, recipe.id);
              
              // 下载新图片
              const imageData = await downloadImageFromUrl(recipe.imagePath);
              if (!imageData) {
                console.error(`Failed to download image from: ${recipe.imagePath}`);
              } else {
                // 删除旧图片（如果存在）
                if (existingRecipe.current_image_path) {
                  await deleteImageFromR2(env.RECIPE_IMAGES, String(existingRecipe.current_image_path));
                }
                
                // 上传新图片到R2
                await uploadImageToR2(env.RECIPE_IMAGES, path, imageData, {
                  userId,
                  recipeId: recipe.id,
                  imageModel: recipe.imageModel || 'unknown'
                });
                
                // 保存图片记录到数据库
                await saveImageRecord(env.RECIPE_EASY_DB, {
                  recipeId: recipe.id,
                  userId,
                  imagePath: path,
                  imageModel: recipe.imageModel || 'unknown'
                });
                
                // 更新菜谱的image_id (已移除，因为该列不存在)
              }
            } catch (error) {
              console.error(`Failed to update image for recipe ${recipe.id}:`, error);
            }
          }
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
          user_id, cuisine_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        userId,
        recipe.cuisineId || 9,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
      
      
      // 如果菜谱有图片，保存图片到R2和recipe_images表
      if (recipe.imagePath) {
        try {
          
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
            
            // 更新菜谱的image_id (已移除，因为该列不存在)
          }
        } catch (error) {
          console.error(`Failed to save image for recipe ${recipe.id}:`, error);
        }
      }
      
      // 添加到保存的菜谱列表
      savedRecipes.push(normalizeRecipeForDatabase(recipe));
      newlySavedRecipes.push(recipe); // 记录新保存的菜谱
    }

    // 准备响应
    const response = new Response(JSON.stringify({
      success: true,
      recipes: savedRecipes,
      count: savedRecipes.length,
      alreadyExists,
      hasUpdatedImage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    // 如果有新保存的菜谱，立即触发翻译（使用 waitUntil 确保异步操作完成）
    if (newlySavedRecipes.length > 0) {
      console.log(`🔄 Starting translation for ${newlySavedRecipes.length} newly saved recipes...`);
      console.log(`📝 Newly saved recipes:`, newlySavedRecipes.map(r => ({ id: r.id, title: r.title })));
      
      // 使用 ctx.waitUntil 确保翻译操作在响应返回后继续执行
      const translationPromise = (async () => {
        try {
          console.log(`🔄 Processing translation for ${newlySavedRecipes.length} recipes...`);
          
          // 为每个新保存的菜谱触发翻译
          const translationPromises = [];
          
          for (const savedRecipe of newlySavedRecipes) {
            // 基于菜谱标题检测语言
            const hasChineseChars = /[\u4e00-\u9fff]/.test(savedRecipe.title);
            const sourceLanguage = hasChineseChars ? 'zh' : 'en';
            const targetLanguage = sourceLanguage === 'zh' ? 'en' : 'zh';
            
            console.log(`🔄 Translating recipe ${savedRecipe.id} from ${sourceLanguage} to ${targetLanguage}`);
            console.log(`📝 Recipe title: "${savedRecipe.title}"`);
            console.log(`🔍 Has Chinese chars: ${hasChineseChars}`);
            
            // 创建翻译 Promise
            const translationPromise = triggerRecipeTranslation(
              {
                id: savedRecipe.id,
                title: savedRecipe.title,
                description: savedRecipe.description,
                difficulty: savedRecipe.difficulty,
                servings: savedRecipe.servings,
                cookingTime: savedRecipe.cookingTime || savedRecipe.cooking_time,
                ingredients: savedRecipe.ingredients || [],
                seasoning: savedRecipe.seasoning || [],
                instructions: savedRecipe.instructions || [],
                chefTips: savedRecipe.chefTips || savedRecipe.chef_tips || [],
                tags: savedRecipe.tags || [],
                language: sourceLanguage
              },
              targetLanguage,
              env.RECIPE_EASY_DB,
              env
            ).then(() => {
              console.log(`✅ Translation completed for recipe ${savedRecipe.id}`);
            }).catch((error) => {
              console.error(`❌ Translation failed for recipe ${savedRecipe.id}:`, error);
            });
            
            translationPromises.push(translationPromise);
          }
          
          // 等待所有翻译完成
          await Promise.allSettled(translationPromises);
          console.log(`✅ All translations processed for ${newlySavedRecipes.length} recipes`);
          
        } catch (error) {
          console.error('Translation processing failed:', error);
          // 翻译失败不影响保存流程
        }
      })();
      
      // 使用 waitUntil 确保翻译操作在响应返回后继续执行
      ctx.waitUntil(translationPromise);
    } else {
      console.log(`ℹ️ No newly saved recipes to translate`);
    }

    return response;
    
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



// 获取用户菜谱列表
async function handleGetUserRecipes(request: Request, db: D1Database, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const rawUserId = pathParts[pathParts.length - 1]; // 获取最后一个部分作为用户ID
    
    // 🔒 安全修复：验证用户ID格式
    const userValidation = validateUserId(rawUserId);
    if (!userValidation.isValid) {
      return new Response(JSON.stringify({ error: userValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const userId = userValidation.userId!;
    const language = url.searchParams.get('lang') || 'en';
    
    // 🔒 安全修复：验证分页参数
    const { limit, offset } = validatePaginationParams(
      url.searchParams.get('limit'), 
      url.searchParams.get('offset')
    );
    const page = Math.floor(offset / limit) + 1;
    
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
    
    // 获取总数
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM recipes WHERE user_id = ?
    `).bind(userId).first();
    
    // 构建查询SQL - 根据是否有翻译表来决定查询结构
    let sql = `
      SELECT r.id, r.title, r.description, r.cooking_time, r.servings, r.difficulty,
             r.ingredients, r.seasoning, r.instructions, r.tags, r.chef_tips,
             r.cuisine_id, r.user_id, r.created_at, r.updated_at,
             ri.image_path, ri.expires_at as image_expires_at, ri.image_model
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
      LEFT JOIN recipe_images ri ON r.id = ri.recipe_id
    `;
    
    // 如果有国际化表，添加菜谱国际化关联
    if (hasI18nTable) {
      sql += ` LEFT JOIN recipes_i18n r18n ON r.id = r18n.recipe_id AND r18n.language_code = ?`;
    }
    
    sql += `
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    // 构建参数数组
    const params: any[] = [];
    if (hasI18nTable) {
      params.push(language);
    }
    params.push(userId, limit, offset);
    
    // 获取菜谱列表（包含图片信息和翻译）
    const recipesResult = await db.prepare(sql).bind(...params).all();
    
    // 格式化菜谱数据
    const recipes = recipesResult.results.map((row: any) => {
      // 使用翻译后的字段（如果存在）或原字段
      const getLocalizedField = (localizedField: any, originalField: any) => {
        return localizedField !== undefined && localizedField !== null ? localizedField : originalField;
      };
      
      const parseJsonField = (field: any) => {
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch {
            return [];
          }
        }
        return Array.isArray(field) ? field : [];
      };
      
      return {
        id: row.id,
        title: hasI18nTable ? getLocalizedField(row.localized_title, row.title) : row.title,
        description: hasI18nTable ? getLocalizedField(row.localized_description, row.description) : row.description,
        cookingTime: row.cooking_time, 
        servings: row.servings,
        difficulty: hasI18nTable ? getLocalizedField(row.localized_difficulty, row.difficulty) : row.difficulty,
        ingredients: parseJsonField(hasI18nTable ? getLocalizedField(row.localized_ingredients, row.ingredients) : row.ingredients),
        seasoning: parseJsonField(hasI18nTable ? getLocalizedField(row.localized_seasoning, row.seasoning) : row.seasoning),
        instructions: parseJsonField(hasI18nTable ? getLocalizedField(row.localized_instructions, row.instructions) : row.instructions),
        tags: parseJsonField(hasI18nTable ? getLocalizedField(row.localized_tags, row.tags) : row.tags),
        chefTips: parseJsonField(hasI18nTable ? getLocalizedField(row.localized_chef_tips, row.chef_tips) : row.chef_tips),
        imagePath: row.image_path ? `${env.WORKER_URL || 'https://api.recipe-easy.com'}/images/${row.image_path}` : null,
        imageExpiresAt: row.image_expires_at,
        imageModel: row.image_model,
        createdAt: row.created_at
      };
    });
    
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
    const rawRecipeId = pathParts[pathParts.length - 1]; // 获取最后一个部分作为菜谱ID
    
    // 🔒 安全修复：验证菜谱ID格式
    const recipeValidation = validateRecipeId(rawRecipeId);
    if (!recipeValidation.isValid) {
      return new Response(JSON.stringify({ error: recipeValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const recipeId = recipeValidation.recipeId!;
    
    const body = await request.json();
    const { userId: bodyUserId } = body;
    
    // 🔒 安全修复：验证用户ID
    const userValidation = validateUserId(bodyUserId);
    if (!userValidation.isValid) {
      return new Response(JSON.stringify({ error: userValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const userId = userValidation.userId!;
    
    // 获取菜谱信息
    const recipeResult = await env.RECIPE_EASY_DB.prepare(`
      SELECT r.user_id, ri.image_path 
      FROM recipes r
      LEFT JOIN recipe_images ri ON r.id = ri.recipe_id
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
        
        // 检查图片是否存在
        const imageObject = await env.RECIPE_IMAGES.head(imagePath);
        if (imageObject) {
          // 删除存在的图片
          await env.RECIPE_IMAGES.delete(imagePath);
        }
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

// 处理模型使用记录
async function handleModelUsage(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const body = await request.json();
    const { model_name, model_type, model_response_id, request_details } = body;

    // 验证必要参数
    if (!model_name || !model_type || !model_response_id) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: model_name, model_type, model_response_id' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 验证模型类型
    if (!['language', 'image'].includes(model_type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid model_type. Must be either "language" or "image"' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 记录模型使用情况
    await recordModelUsage(db, {
      model_name,
      model_type: model_type as 'language' | 'image',
      model_response_id,
      request_details
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Model usage recorded successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Model usage recording error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to record model usage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 处理管理员菜谱的API
async function handleAdminRecipes(request: Request, db: D1Database, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    
    // 参数验证和限制
    const { limit, offset } = validatePaginationParams(
      searchParams.get('limit'), 
      searchParams.get('offset')
    );
    const language = searchParams.get('lang') || 'en';

    // 获取管理员用户ID
    const adminConfig = await db.prepare(`
      SELECT value FROM system_configs WHERE key = 'admin_id'
    `).first();
    const adminUserId = adminConfig?.value;

    if (!adminUserId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Admin user ID not configured',
        results: [],
        total: 0,
        limit,
        offset,
        language,
        source: 'cold_start'
      }), {
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

    // 构建查询SQL - 根据是否有翻译表来决定查询结构
    let sql = `
      SELECT r.*, c.name as cuisine_name,
             c.css_class,
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
    
    // 如果有国际化表，添加菜谱国际化关联
    if (hasI18nTable) {
      sql += ` LEFT JOIN recipes_i18n r18n ON r.id = r18n.recipe_id AND r18n.language_code = ?`;
    }
    
    sql += `
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // 构建参数数组
    const params: any[] = [language];
    if (hasI18nTable) {
      params.push(language);
    }
    params.push(adminUserId as string, limit, offset);

    // 执行查询
    const { results } = await db.prepare(sql).bind(...params).all();
    const recipes = results || [];

    // 获取所有菜谱的图片信息
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
      // 根据菜系ID映射到正确的slug
      const slugMap: Record<number, string> = {
        1: 'chinese',
        2: 'italian', 
        3: 'french',
        4: 'indian',
        5: 'japanese',
        6: 'mediterranean',
        7: 'thai',
        8: 'mexican',
        9: 'others'
      };
      
      // 使用关联查询的结果获取图片路径
      let imagePath = imageMap[recipe.id] || null;
      
      // 使用翻译后的字段（如果存在）或原字段
      const getLocalizedField = (localizedField: any, originalField: any) => {
        return localizedField !== undefined && localizedField !== null ? localizedField : originalField;
      };
      
      const parseJsonField = (field: any) => {
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch {
            return [];
          }
        }
        return Array.isArray(field) ? field : [];
      };
      
      return {
        id: recipe.id,
        title: hasI18nTable ? getLocalizedField(recipe.localized_title, recipe.title) : (recipe.title || `Recipe ${recipe.id}`),
        description: hasI18nTable ? getLocalizedField(recipe.localized_description, recipe.description) : (recipe.description || `Description for Recipe ${recipe.id}`),
        imagePath: imagePath, // 从 recipe_images 表获取的图片URL
        ingredients: parseJsonField(hasI18nTable ? getLocalizedField(recipe.localized_ingredients, recipe.ingredients) : recipe.ingredients),
        seasoning: parseJsonField(hasI18nTable ? getLocalizedField(recipe.localized_seasoning, recipe.seasoning) : recipe.seasoning),
        instructions: parseJsonField(hasI18nTable ? getLocalizedField(recipe.localized_instructions, recipe.instructions) : recipe.instructions),
        chefTips: parseJsonField(hasI18nTable ? getLocalizedField(recipe.localized_chef_tips, recipe.chef_tips) : recipe.chef_tips),
        tags: parseJsonField(hasI18nTable ? getLocalizedField(recipe.localized_tags, recipe.tags) : recipe.tags),
        difficulty: hasI18nTable ? getLocalizedField(recipe.localized_difficulty, recipe.difficulty) : (recipe.difficulty || 'easy'),
        cookingTime: recipe.cooking_time || 30, // 统一返回驼峰格式
        servings: recipe.servings || 4,
        user_id: recipe.user_id, // 添加用户ID
        cuisine: {
          id: recipe.cuisine_id || 1,
          slug: slugMap[Number(recipe.cuisine_id)] || 'other',
          name: recipe.localized_cuisine_name || recipe.cuisine_name || 'Other',
          cssClass: recipe.css_class || 'cuisine-other'
        },
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        source: 'cold_start'
      }
    });

    return new Response(JSON.stringify({
      success: true,
      results: formattedRecipes,
      total: formattedRecipes.length,
      limit,
      offset,
      language,
      source: 'cold_start'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in handleAdminRecipes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch cold start recipes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export default worker;