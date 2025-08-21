import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 直接从数据库获取数据
async function getDataFromDatabase(request: NextRequest) {
  try {
    let env: any;
    
    try {
      const { env: cloudflareEnv } = await getCloudflareContext();
      env = cloudflareEnv;
    } catch (error) {
      env = process.env;
    }

    const db = env.RECIPE_EASY_DB;
    
    if (!db) {
      throw new Error('数据库绑定不可用');
    }
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;
    const lang = searchParams.get('lang') || 'en';
    const type = searchParams.get('type') || 'latest';
    const search = searchParams.get('search') || '';
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    let bindParams: any[] = [];
    const orderBy = 'ORDER BY r.created_at DESC';
    
    // 搜索功能
    if (search) {
      if (lang === 'zh') {
        whereClause += ` AND (
          r.title LIKE ? OR 
          r.description LIKE ? OR 
          ri.title LIKE ? OR 
          ri.description LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        bindParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      } else {
        whereClause += ` AND (
          r.title LIKE ? OR 
          r.description LIKE ? OR 
          ri.title LIKE ? OR 
          ri.description LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        bindParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
    }
    
    let recipes: any;
    let totalResult: any;

    if (lang === 'zh') {
      // 中文查询
      const zhQuery = `
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
        ${whereClause}
        ${orderBy}
        LIMIT ? OFFSET ?
      `;
      recipes = await db.prepare(zhQuery).bind(...bindParams, limit, offset).all();
      
      // 获取中文总数
      totalResult = await db.prepare(`
        SELECT COUNT(*) as count FROM recipes r
        LEFT JOIN recipes_i18n ri ON r.id = ri.recipe_id AND ri.language_code = 'zh'
        ${whereClause}
      `).bind(...bindParams).first();
    } else {
      // 英文查询 - 需要 JOIN recipes_i18n 表获取英文版本
      const enQuery = `
        SELECT 
          r.id, r.title, r.description, r.cooking_time, r.servings, r.difficulty,
          rim.image_path as imagePath,
          r.ingredients, r.seasoning, r.instructions, r.chef_tips,
          r.created_at, r.updated_at,
          c.name as cuisine_name, c.slug as cuisine_slug, c.id as cuisine_id,
          ri.title as title_en, ri.description as description_en,
          ri.ingredients as ingredients_en, ri.seasoning as seasoning_en,
          ri.instructions as instructions_en, ri.chef_tips as chef_tips_en,
          ri.difficulty as difficulty_en, ri.tags as tags_en
        FROM recipes r
        LEFT JOIN cuisines c ON r.cuisine_id = c.id
        LEFT JOIN recipes_i18n ri ON r.id = ri.recipe_id AND ri.language_code = 'en'
        LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
        ${whereClause}
        ${orderBy}
        LIMIT ? OFFSET ?
      `;
      recipes = await db.prepare(enQuery).bind(...bindParams, limit, offset).all();
      
      // 获取英文总数
      totalResult = await db.prepare(`
        SELECT COUNT(*) as count FROM recipes r
        LEFT JOIN recipes_i18n ri ON r.id = ri.recipe_id AND ri.language_code = 'en'
        ${whereClause}
      `).bind(...bindParams).first();
    }

    const total = totalResult?.count || 0;

    // 转换数据格式
    const recipeList = recipes?.results || recipes || [];
    const transformedRecipes = (Array.isArray(recipeList) ? recipeList : []).map((recipe: any) => ({
      id: recipe.id,
      title: lang === 'zh' && recipe.title_zh ? recipe.title_zh : 
             lang === 'en' && recipe.title_en ? recipe.title_en : recipe.title,
      description: lang === 'zh' && recipe.description_zh ? recipe.description_zh : 
                  lang === 'en' && recipe.description_en ? recipe.description_en : recipe.description,
      cookingTime: recipe.cooking_time,
      servings: recipe.servings,
      difficulty: lang === 'zh' && recipe.difficulty_zh ? recipe.difficulty_zh :
                 lang === 'en' && recipe.difficulty_en ? recipe.difficulty_en : recipe.difficulty,
      imagePath: recipe.imagePath,
      ingredients: lang === 'zh' && recipe.ingredients_zh ? 
        JSON.parse(recipe.ingredients_zh) : 
        lang === 'en' && recipe.ingredients_en ?
        JSON.parse(recipe.ingredients_en) :
        JSON.parse(recipe.ingredients || '[]'),
      seasoning: lang === 'zh' && recipe.seasoning_zh ? 
        JSON.parse(recipe.seasoning_zh) : 
        lang === 'en' && recipe.seasoning_en ?
        JSON.parse(recipe.seasoning_en) :
        JSON.parse(recipe.seasoning || '[]'),
      instructions: lang === 'zh' && recipe.instructions_zh ? 
        JSON.parse(recipe.instructions_zh) : 
        lang === 'en' && recipe.instructions_en ?
        JSON.parse(recipe.instructions_en) :
        JSON.parse(recipe.instructions || '[]'),
      chefTips: lang === 'zh' && recipe.chef_tips_zh ? 
        JSON.parse(recipe.chef_tips_zh) : 
        lang === 'en' && recipe.chef_tips_en ?
        JSON.parse(recipe.chef_tips_en) :
        JSON.parse(recipe.chef_tips || '[]'),
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
      results: transformedRecipes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    // 数据库查询失败
    return NextResponse.json(
      { error: '数据库查询失败', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 直接查询数据库
    return await getDataFromDatabase(request);
  } catch (error) {
    // 获取食谱失败
    // 本地开发环境返回模拟数据
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    const mockRecipes = Array.from({ length: Math.min(limit, 6) }, (_, i) => ({
      id: `recipe-${i + 1}`,
      title: lang === 'zh' ? `测试菜谱 ${i + 1}` : `Test Recipe ${i + 1}`,
      description: lang === 'zh' ? `这是一个测试菜谱 ${i + 1}` : `This is a test recipe ${i + 1}`,
      cookingTime: 30,
      servings: 4,
      difficulty: 'easy',
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
      results: mockRecipes,
      pagination: {
        page,
        limit,
        total: mockRecipes.length,
        totalPages: 1
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 创建新菜谱的逻辑
    return NextResponse.json({ success: true, id: 'new-recipe-id' });
  } catch (error) {
    // 创建食谱失败
    return NextResponse.json({ error: '创建食谱失败' }, { status: 500 });
  }
}
