import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 直接从数据库获取数据
async function getDataFromDatabase(request: NextRequest, userId: string) {
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
    
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;
      const lang = searchParams.get('lang') || 'en';
      
      console.log('📋 查询用户食谱参数:', { userId, page, limit, offset, lang });
      
      let recipes: any;
      let totalResult: any;

      if (lang === 'zh') {
        // 中文查询用户食谱
        recipes = await db.prepare(`
          SELECT 
            r.id, r.title, r.description, r.cooking_time, r.servings, r.difficulty,
            rim.image_path as imagePath,
            r.ingredients, r.seasoning, r.instructions, r.chef_tips,
            r.created_at, r.updated_at,
            c.name as cuisine_name, c.slug as cuisine_slug, c.id as cuisine_id,
            ri.title as title_zh, ri.description as description_zh,
            ri.ingredients as ingredients_zh, ri.seasoning as seasoning_zh,
            ri.instructions as instructions_zh, ri.chef_tips as chef_tips_zh
          FROM recipes r
          LEFT JOIN cuisines c ON r.cuisine_id = c.id
          LEFT JOIN recipes_i18n ri ON r.id = ri.recipe_id AND ri.language_code = 'zh'
          LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
          WHERE r.user_id = ?
          ORDER BY r.created_at DESC
          LIMIT ? OFFSET ?
        `).bind(userId, limit, offset).all();
      } else {
        // 英文查询用户食谱
        recipes = await db.prepare(`
          SELECT 
            r.id, r.title, r.description, r.cooking_time, r.servings, r.difficulty,
            rim.image_path as imagePath,
            r.ingredients, r.seasoning, r.instructions, r.chef_tips,
            r.created_at, r.updated_at,
            c.name as cuisine_name, c.slug as cuisine_slug, c.id as cuisine_id
          FROM recipes r
          LEFT JOIN cuisines c ON r.cuisine_id = c.id
          LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
          WHERE r.user_id = ?
          ORDER BY r.created_at DESC
          LIMIT ? OFFSET ?
        `).bind(userId, limit, offset).all();
      }
      
      // 获取用户食谱总数
      totalResult = await db.prepare('SELECT COUNT(*) as total FROM recipes WHERE user_id = ?').bind(userId).first();
      const total = Number(totalResult?.total) || 0;
      
      // 转换数据格式以匹配前端期望的格式
      const transformedRecipes = (recipes?.results || []).map((recipe: any) => ({
        id: recipe.id,
        title: lang === 'zh' && recipe.title_zh ? recipe.title_zh : recipe.title,
        description: lang === 'zh' && recipe.description_zh ? recipe.description_zh : recipe.description,
        cookingTime: recipe.cooking_time || 30,
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty || 'easy',
        imagePath: recipe.imagePath,
        ingredients: lang === 'zh' && recipe.ingredients_zh ? JSON.parse(recipe.ingredients_zh) : JSON.parse(recipe.ingredients || '[]'),
        seasoning: lang === 'zh' && recipe.seasoning_zh ? JSON.parse(recipe.seasoning_zh) : JSON.parse(recipe.seasoning || '[]'),
        instructions: lang === 'zh' && recipe.instructions_zh ? JSON.parse(recipe.instructions_zh) : JSON.parse(recipe.instructions || '[]'),
        chefTips: lang === 'zh' && recipe.chef_tips_zh ? JSON.parse(recipe.chef_tips_zh) : JSON.parse(recipe.chef_tips || '[]'),
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
        cuisine: recipe.cuisine_name ? {
          id: recipe.cuisine_id,
          name: recipe.cuisine_name,
          slug: recipe.cuisine_slug
        } : undefined
      }));
      
      return NextResponse.json({
        success: true,
        recipes: transformedRecipes,
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  console.log('👤 获取用户食谱列表:', userId);
  
  try {
    // 直接查询数据库
    return await getDataFromDatabase(request, userId);
  } catch (error) {
    console.error('❌ 获取用户食谱失败:', error);
    console.log('Database not available in development environment, returning mock data');
    
    // 在本地开发环境返回 mock 数据
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    const mockRecipes = Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      id: `user-recipe-${i + 1}`,
      title: lang === 'zh' ? `我的菜谱 ${i + 1}` : `My Recipe ${i + 1}`,
      description: lang === 'zh' ? `这是我创建的菜谱 ${i + 1}` : `This is my created recipe ${i + 1}`,
      cookingTime: 30,
      servings: 4,
      difficulty: 'medium',
      imagePath: `/images/recipe-placeholder.jpg`,
      ingredients: lang === 'zh' ? ['食材1', '食材2'] : ['Ingredient 1', 'Ingredient 2'],
      seasoning: lang === 'zh' ? ['调料1', '调料2'] : ['Seasoning 1', 'Seasoning 2'],
      instructions: lang === 'zh' ? ['步骤1', '步骤2'] : ['Step 1', 'Step 2'],
      chefTips: lang === 'zh' ? ['小贴士1'] : ['Tip 1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cuisine: {
        id: 1,
        name: lang === 'zh' ? '中式' : 'Chinese',
        slug: 'chinese'
      }
    }));
    
    return NextResponse.json({
      success: true,
      recipes: mockRecipes,
      pagination: {
        page,
        limit,
        total: mockRecipes.length,
        totalPages: 1
      }
    });
  }
} 