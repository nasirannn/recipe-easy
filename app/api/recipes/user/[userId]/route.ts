import { NextRequest, NextResponse } from 'next/server';
import { getD1Database, isCloudflareWorkers } from '@/lib/utils/database-utils';
import { createCorsHeaders } from '@/lib/utils/cors';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const lang = searchParams.get('lang') || 'en';
    const offset = (page - 1) * limit;
    const { userId } = await params;
    
    console.log('User recipes API called with params:', { userId, page, limit, lang, offset });

    // 检查是否在 Cloudflare Workers 环境中
    const isWorker = isCloudflareWorkers();
    console.log('Is Cloudflare Workers environment:', isWorker);

    if (isWorker) {
      // 在 Cloudflare Workers 环境中，直接查询数据库
      console.log('Using database directly');
      return await getUserRecipesFromDatabase(userId, page, limit, lang);
    } else {
      // 在本地开发环境中，调用 Cloudflare Worker API
      console.log('Using Worker API');
      return await getUserRecipesFromWorker(userId, page, limit, lang);
    }
    
  } catch (error) {
    console.error('Get user recipes error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user recipes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 从数据库直接获取用户菜谱
 */
async function getUserRecipesFromDatabase(userId: string, page: number, limit: number, lang: string) {
  try {
    const db = getD1Database();
    if (!db) {
      throw new Error('Database not available');
    }

    const offset = (page - 1) * limit;

    // 获取用户菜谱总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM recipes r
      WHERE r.user_id = ?
    `;
    
    const countResult = await db.prepare(countQuery).bind(userId).first();
    const total = countResult?.total || 0;

    // 获取用户菜谱列表，支持国际化
    const recipesQuery = `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.cooking_time as cookingTime,
        r.servings,
        r.difficulty,
        r.tags,
        r.ingredients,
        r.seasoning,
        r.instructions,
        r.chef_tips as chefTips,
        r.created_at as createdAt,
        r.updated_at as updatedAt,
        c.id as cuisine_id,
        c.name as cuisine_name,
        ri.image_path as imagePath,
        COALESCE(ri18n.title, r.title) as localized_title,
        COALESCE(ri18n.description, r.description) as localized_description,
        COALESCE(ri18n.ingredients, r.ingredients) as localized_ingredients,
        COALESCE(ri18n.seasoning, r.seasoning) as localized_seasoning,
        COALESCE(ri18n.instructions, r.instructions) as localized_instructions,
        COALESCE(ri18n.chef_tips, r.chef_tips) as localized_chef_tips,
        COALESCE(ri18n.tags, r.tags) as localized_tags,
        COALESCE(ri18n.difficulty, r.difficulty) as localized_difficulty
      FROM recipes r
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      LEFT JOIN recipe_images ri ON r.id = ri.recipe_id
      LEFT JOIN recipes_i18n ri18n ON r.id = ri18n.recipe_id AND ri18n.language_code = ?
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const recipesResult = await db.prepare(recipesQuery).bind(lang, userId, limit, offset).all();
    const recipes = recipesResult.results || [];
    
    console.log('User recipes fetched from database:', recipes.length);
    
    // 转换数据格式
    const transformedRecipes = recipes.map((recipe: any) => ({
      id: recipe.id,
      title: recipe.localized_title || recipe.title,
      description: recipe.localized_description || recipe.description,
      imagePath: recipe.imagePath,
      cookingTime: recipe.cookingTime,
      servings: recipe.servings,
      difficulty: recipe.localized_difficulty || recipe.difficulty,
      tags: recipe.localized_tags ? JSON.parse(recipe.localized_tags) : (recipe.tags ? JSON.parse(recipe.tags) : []),
      ingredients: recipe.localized_ingredients ? JSON.parse(recipe.localized_ingredients) : (recipe.ingredients ? JSON.parse(recipe.ingredients) : []),
      seasoning: recipe.localized_seasoning ? JSON.parse(recipe.localized_seasoning) : (recipe.seasoning ? JSON.parse(recipe.seasoning) : []),
      instructions: recipe.localized_instructions ? JSON.parse(recipe.localized_instructions) : (recipe.instructions ? JSON.parse(recipe.instructions) : []),
      chefTips: recipe.localized_chef_tips ? JSON.parse(recipe.localized_chef_tips) : (recipe.chefTips ? JSON.parse(recipe.chefTips) : []),
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      cuisine: recipe.cuisine_id ? {
        id: recipe.cuisine_id,
        name: recipe.cuisine_name
      } : null
    }));
    
    return NextResponse.json({
      success: true,
      results: transformedRecipes,
      total,
      page,
      limit,
      hasMore: offset + limit < (total as number)
    }, {
      headers: createCorsHeaders()
    });

  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * 从 Cloudflare Worker API 获取用户菜谱
 */
async function getUserRecipesFromWorker(userId: string, page: number, limit: number, lang: string) {
  try {
    // 构建查询参数
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('lang', lang);

    const workerUrl = `${process.env.WORKER_URL || 'https://recipe-easy.com'}/api/recipes/user/${userId}?${params}`;
    console.log('Calling Worker API:', workerUrl);

    // 调用 Cloudflare Worker API
    const response = await fetch(workerUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Worker API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Worker error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('Worker API response data:', data);
    return NextResponse.json(data, {
      headers: createCorsHeaders()
    });
  } catch (error) {
    console.error('Error calling Worker API:', error);
    throw error;
  }
} 