import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 直接从数据库获取数据
async function getDataFromDatabase(request: NextRequest) {
  try {
    console.log('🗄️ 直接查询数据库');
    // 在 Cloudflare Worker 环境中，通过 globalThis 访问环境变量
    let db: any;
    
    try {
      // 使用已导入的 getCloudflareContext
      const { env } = await getCloudflareContext();
      db = env.RECIPE_EASY_DB;
    } catch (error) {
      console.log('⚠️ @opennextjs/cloudflare 不可用，尝试直接访问环境');
      // 如果 @opennextjs/cloudflare 不可用，尝试直接访问环境
      // @ts-ignore - 在 Cloudflare Worker 环境中，env 可能直接可用
      db = (globalThis as any).env?.RECIPE_EASY_DB || (globalThis as any).RECIPE_EASY_DB;
    }
    
    if (!db) {
      throw new Error('数据库绑定不可用 - 请检查 Cloudflare Worker 配置');
    }
    
    console.log('✅ 数据库连接成功');
    
    // 测试简单查询
    try {
      const testResult = await db.prepare('SELECT COUNT(*) as count FROM recipes').first();
      console.log('🧪 测试查询结果:', testResult);
    } catch (testError) {
      console.error('❌ 测试查询失败:', testError);
      throw new Error(`测试查询失败: ${testError}`);
    }
    
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;
      const lang = searchParams.get('lang') || 'en';
      const type = searchParams.get('type') || 'all'; // 'all', 'admin_recent', 'all_sorted'
      const search = searchParams.get('search') || '';
      
      console.log('📋 查询参数:', { page, limit, offset, lang, type, search });
      
      let recipes: any;
      let totalResult: any;

      if (type === 'admin_recent') {
        // 获取管理员最近6条食谱
        const adminConfig = await db.prepare(`
          SELECT value FROM system_configs WHERE key = 'admin_id'
        `).first();

        if (!adminConfig || !adminConfig.value) {
          return NextResponse.json(
            { error: '管理员用户ID未配置' },
            { status: 404 }
          );
        }

        const adminUserId = adminConfig.value;
        
        // 构建查询条件
        let whereClause = 'WHERE r.user_id = ?';
        let bindParams: any[] = [adminUserId];

        if (search) {
          whereClause += ' AND (r.title LIKE ? OR ri.title LIKE ? OR r.description LIKE ? OR ri.description LIKE ?)';
          const searchTerm = `%${search}%`;
          bindParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (lang === 'zh') {
          // 中文查询管理员食谱
          recipes = await db.prepare(`
            SELECT 
              r.id, r.title, r.description, r.cooking_time as cookingTime,
              r.servings, r.difficulty,
              rim.image_path as imagePath,
              r.ingredients, r.seasoning, r.instructions, r.chef_tips as chefTips,
              r.created_at as createdAt, r.updated_at as updatedAt,
              c.name as cuisine_name, c.slug as cuisine_slug, c.id as cuisine_id,
              ri.title as title_zh, ri.description as description_zh,
              ri.ingredients as ingredients_zh, ri.seasoning as seasoning_zh,
              ri.instructions as instructions_zh, ri.chef_tips as chefTips_zh
            FROM recipes r
            LEFT JOIN cuisines c ON r.cuisine_id = c.id
            LEFT JOIN recipes_i18n ri ON r.id = ri.recipe_id AND ri.language_code = 'zh'
            LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT 6
          `).bind(...bindParams).all();
        } else {
          // 英文查询管理员食谱
          recipes = await db.prepare(`
            SELECT 
              r.id, r.title, r.description, r.cooking_time as cookingTime,
              r.servings, r.difficulty,
              rim.image_path as imagePath,
              r.ingredients, r.seasoning, r.instructions, r.chef_tips as chefTips,
              r.created_at as createdAt, r.updated_at as updatedAt,
              c.name as cuisine_name, c.slug as cuisine_slug, c.id as cuisine_id
            FROM recipes r
            LEFT JOIN cuisines c ON r.cuisine_id = c.id
            LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT 6
          `).bind(...bindParams).all();
        }

        // 获取管理员食谱总数
        totalResult = await db.prepare(`
          SELECT COUNT(*) as total FROM recipes WHERE user_id = ?
        `).bind(adminUserId).first();

      } else {
        // 获取所有食谱，按创建时间倒序排列
        let whereClause = '';
        let bindParams: any[] = [];

        if (search) {
          whereClause = 'WHERE (r.title LIKE ? OR ri.title LIKE ? OR r.description LIKE ? OR ri.description LIKE ?)';
          const searchTerm = `%${search}%`;
          bindParams = [searchTerm, searchTerm, searchTerm, searchTerm];
        }

        console.log('🔍 执行查询，whereClause:', whereClause, 'bindParams:', bindParams);

        if (lang === 'zh') {
          // 中文查询所有食谱
          recipes = await db.prepare(`
            SELECT 
              r.id, r.title, r.description, r.cooking_time as cookingTime,
              r.servings, r.difficulty,
              rim.image_path as imagePath,
              r.ingredients, r.seasoning, r.instructions, r.chef_tips as chefTips,
              r.created_at as createdAt, r.updated_at as updatedAt,
              c.name as cuisine_name, c.slug as cuisine_slug, c.id as cuisine_id,
              ri.title as title_zh, ri.description as description_zh,
              ri.ingredients as ingredients_zh, ri.seasoning as seasoning_zh,
              ri.instructions as instructions_zh, ri.chef_tips as chefTips_zh
            FROM recipes r
            LEFT JOIN cuisines c ON r.cuisine_id = c.id
            LEFT JOIN recipes_i18n ri ON r.id = ri.recipe_id AND ri.language_code = 'zh'
            LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
          `).bind(...bindParams, limit, offset).all();
        } else {
          // 英文查询所有食谱 - 简化版本
          console.log('🇺🇸 执行英文查询');
          recipes = await db.prepare(`
            SELECT 
              r.id, r.title, r.description, r.cooking_time as cookingTime,
              r.servings, r.difficulty,
              rim.image_path as imagePath,
              r.ingredients, r.seasoning, r.instructions, r.chef_tips as chefTips,
              r.created_at as createdAt, r.updated_at as updatedAt,
              c.name as cuisine_name, c.slug as cuisine_slug, c.id as cuisine_id
            FROM recipes r
            LEFT JOIN cuisines c ON r.cuisine_id = c.id
            LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
          `).bind(...bindParams, limit, offset).all();
          
          console.log('✅ 英文查询完成，结果数量:', recipes?.results?.length || 0);
        }

        // 获取所有食谱总数
        totalResult = await db.prepare('SELECT COUNT(*) as total FROM recipes').first();
      }
      
      const total = Number(totalResult?.total) || 0;
      
      // 转换数据格式以匹配前端期望的格式
      const transformedRecipes = (recipes?.results || []).map((recipe: any) => ({
        id: recipe.id,
        title: lang === 'zh' && recipe.title_zh ? recipe.title_zh : recipe.title,
        description: lang === 'zh' && recipe.description_zh ? recipe.description_zh : recipe.description,
        cookingTime: recipe.cookingTime || 30,
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty || 'easy',
        imagePath: recipe.imagePath,
        ingredients: lang === 'zh' && recipe.ingredients_zh ? JSON.parse(recipe.ingredients_zh) : JSON.parse(recipe.ingredients || '[]'),
        seasoning: lang === 'zh' && recipe.seasoning_zh ? JSON.parse(recipe.seasoning_zh) : JSON.parse(recipe.seasoning || '[]'),
        instructions: lang === 'zh' && recipe.instructions_zh ? JSON.parse(recipe.instructions_zh) : JSON.parse(recipe.instructions || '[]'),
        chefTips: lang === 'zh' && recipe.chefTips_zh ? JSON.parse(recipe.chefTips_zh) : JSON.parse(recipe.chefTips || '[]'),
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
        cuisine: recipe.cuisine_name ? {
          id: recipe.cuisine_id,
          name: recipe.cuisine_name,
          slug: recipe.cuisine_slug
        } : undefined
      }));
      
      return NextResponse.json({
        success: true,
        results: transformedRecipes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }
    
    return NextResponse.json({ error: '不支持的请求方法' }, { status: 405 });
  } catch (error) {
    console.error('❌ 数据库查询失败:', error);
    return NextResponse.json(
      { error: '数据库查询失败', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('📋 获取食谱列表');
  
  try {
    // 直接查询数据库
    return await getDataFromDatabase(request);
  } catch (error) {
    console.error('❌ 获取食谱失败:', error);
    console.log('Database not available in development environment, returning mock data');
    
    // 在本地开发环境返回 mock 数据
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const lang = searchParams.get('lang') || 'en';
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const mockRecipes = Array.from({ length: Math.min(limit, 6) }, (_, i) => ({
      id: i + 1,
      title: lang === 'zh' ? `测试菜谱 ${i + 1}` : `Test Recipe ${i + 1}`,
      description: lang === 'zh' ? `这是测试菜谱 ${i + 1} 的描述` : `This is description for test recipe ${i + 1}`,
      slug: `test-recipe-${i + 1}`,
      image_path: `/images/recipe-placeholder.jpg`,
      servings: 4,
      prep_time: 15,
      cook_time: 30,
      difficulty: 'medium',
      cuisine: {
        id: 1,
        name: lang === 'zh' ? '中式' : 'Chinese',
        slug: 'chinese'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    if (type === 'admin_recent') {
      return NextResponse.json({
        success: true,
        results: mockRecipes,
        language: lang
      });
    } else {
      return NextResponse.json({
        success: true,
        results: mockRecipes,
        pagination: {
          total: mockRecipes.length,
          page: 1,
          limit: limit,
          totalPages: 1
        },
        language: lang
      });
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('➕ 创建新食谱');
  
  try {
    // 直接操作数据库
    return await getDataFromDatabase(request);
  } catch (error) {
    console.error('❌ 创建食谱失败:', error);
    console.log('Database not available in development environment, returning mock response');
    
    // 在本地开发环境返回 mock 响应
    return NextResponse.json({
      success: true,
      message: 'Mock recipe created successfully',
      id: Math.floor(Math.random() * 1000)
    });
  }
}
