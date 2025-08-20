/**
 * 管理员菜谱API路由
 * 
 * 处理管理员创建的菜谱的获取
 */

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
    
    // 根据请求方法处理不同的操作
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const lang = searchParams.get('lang') || 'en';
      const offset = (page - 1) * limit;
      
      // 获取管理员用户ID
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
      
      if (lang === 'zh') {
        // 中文查询管理员食谱
        const recipes = await db.prepare(`
          SELECT 
            r.id, r.title, r.description, r.cooking_time, r.servings, r.difficulty,
            rim.image_path as imagePath,
            r.ingredients, r.seasoning, r.instructions, r.chef_tips as chefTips,
            r.created_at as createdAt, r.updated_at as updatedAt,
            c.name as cuisine_name, c.slug as cuisine_slug,
            ri.title as title_zh, ri.description as description_zh,
            ri.ingredients as ingredients_zh, ri.seasoning as seasoning_zh,
            ri.instructions as instructions_zh, ri.chef_tips as chefTips_zh
          FROM recipes r
          LEFT JOIN cuisines c ON r.cuisine_id = c.id
          LEFT JOIN recipes_i18n ri ON r.id = ri.recipe_id AND ri.language_code = 'zh'
          LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
          WHERE r.user_id = ?
          ORDER BY r.created_at DESC
          LIMIT ? OFFSET ?
        `).bind(adminUserId, limit, offset).all();
        
        const totalResult = await db.prepare(`
          SELECT COUNT(*) as total FROM recipes WHERE user_id = ?
        `).bind(adminUserId).first();
        
        const total = Number(totalResult?.total) || 0;
        
        // 转换数据格式，解析JSON字段
        const recipeList = recipes?.results || recipes || [];
        const transformedRecipes = (Array.isArray(recipeList) ? recipeList : []).map((recipe: any) => ({
          id: recipe.id,
          title: recipe.title_zh || recipe.title,
          description: recipe.description_zh || recipe.description,
          cookingTime: recipe.cooking_time,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          imagePath: recipe.imagePath,
          ingredients: recipe.ingredients_zh ? 
            JSON.parse(recipe.ingredients_zh) : 
            JSON.parse(recipe.ingredients || '[]'),
          seasoning: recipe.seasoning_zh ? 
            JSON.parse(recipe.seasoning_zh) : 
            JSON.parse(recipe.seasoning || '[]'),
          instructions: recipe.instructions_zh ? 
            JSON.parse(recipe.instructions_zh) : 
            JSON.parse(recipe.instructions || '[]'),
          chefTips: recipe.chefTips_zh ? 
            JSON.parse(recipe.chefTips_zh) : 
            JSON.parse(recipe.chefTips || '[]'),
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
      } else {
        // 英文查询管理员食谱
        const recipes = await db.prepare(`
          SELECT 
            r.id, r.title, r.description, r.cooking_time as cookingTime,
            r.servings, r.difficulty,
            rim.image_path as imagePath,
            r.ingredients, r.seasoning, r.instructions, r.chef_tips as chefTips,
            r.created_at as createdAt, r.updated_at as updatedAt,
            c.name as cuisine_name, c.slug as cuisine_slug
          FROM recipes r
          LEFT JOIN cuisines c ON r.cuisine_id = c.id
          LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
          WHERE r.user_id = ?
          ORDER BY r.created_at DESC
          LIMIT ? OFFSET ?
        `).bind(adminUserId, limit, offset).all();
        
        const totalResult = await db.prepare(`
          SELECT COUNT(*) as total FROM recipes WHERE user_id = ?
        `).bind(adminUserId).first();
        
        const total = Number(totalResult?.total) || 0;
        
        // 转换数据格式，解析JSON字段
        const recipeList = recipes?.results || recipes || [];
        const transformedRecipes = (Array.isArray(recipeList) ? recipeList : []).map((recipe: any) => ({
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          cookingTime: recipe.cookingTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          imagePath: recipe.imagePath,
          ingredients: JSON.parse(recipe.ingredients || '[]'),
          seasoning: JSON.parse(recipe.seasoning || '[]'),
          instructions: JSON.parse(recipe.instructions || '[]'),
          chefTips: JSON.parse(recipe.chefTips || '[]'),
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
    }
    
    return NextResponse.json({ error: '不支持的请求方法' }, { status: 405 });
  } catch (error) {
    console.error('❌ 数据库查询失败:', error);
    return NextResponse.json(
      { error: '数据库查询失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('📊 获取管理员食谱列表');
  
  // 直接尝试查询数据库
  return await getDataFromDatabase(request);
} 