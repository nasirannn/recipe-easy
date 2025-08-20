/**
 * 管理员菜谱API路由
 * 
 * 处理管理员创建的菜谱的获取
 */

import { NextRequest, NextResponse } from 'next/server';
import { getD1Database, isCloudflareWorkers } from '@/lib/utils/database-utils';
import { getWorkerApiUrl } from '@/lib/config';
import { createCorsHeaders } from '@/lib/utils/cors';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * OPTIONS /api/recipes/admin
 * 处理预检请求
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders()
  });
}

/**
 * GET /api/recipes/admin
 * 获取管理员创建的菜谱列表
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const lang = searchParams.get('lang') || 'en';
    const search = searchParams.get('search');
    const cuisineId = searchParams.get('cuisineId');

    console.log('Admin recipes API called with params:', { limit, offset, lang, search, cuisineId });

    // 检查是否在 Cloudflare Workers 环境中
    const isWorker = isCloudflareWorkers();
    console.log('Is Cloudflare Workers environment:', isWorker);

    if (isWorker) {
      // 在 Cloudflare Workers 环境中，直接查询数据库
      console.log('Using database directly');
      return await getAdminRecipesFromDatabase(req);
    } else {
      // 在本地开发环境中，调用 Cloudflare Worker API
      console.log('Using Worker API');
      return await getAdminRecipesFromWorker(req);
    }

  } catch (error) {
    console.error('Error fetching admin recipes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin recipes', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: createCorsHeaders()
      }
    );
  }
}

/**
 * 从数据库直接获取管理员菜谱
 */
async function getAdminRecipesFromDatabase(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');
  const lang = searchParams.get('lang') || 'en';
  const search = searchParams.get('search');
  const cuisineId = searchParams.get('cuisineId');

  try {
    const db = getD1Database();
    if (!db) {
      throw new Error('Database not available');
    }

    // 构建查询条件 - 暂时获取所有食谱，不使用 is_admin 列
    let whereConditions = ['1=1']; // 获取所有食谱
    let params: any[] = [];

    if (search) {
      whereConditions.push('(r.title LIKE ? OR r.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (cuisineId) {
      whereConditions.push('r.cuisine_id = ?');
      params.push(cuisineId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM recipes r
      ${whereClause}
    `;
    
    const countResult = await db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // 获取菜谱列表
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
        ri.image_path as imagePath
      FROM recipes r
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      LEFT JOIN recipe_images ri ON r.id = ri.recipe_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const recipesResult = await db.prepare(recipesQuery).bind(...params, limit, offset).all();
    const recipes = recipesResult.results || [];

    // 转换数据格式
    const transformedRecipes = recipes.map((recipe: any) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      imagePath: recipe.imagePath,
      cookingTime: recipe.cookingTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      tags: recipe.tags ? JSON.parse(recipe.tags) : [],
      ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
      seasoning: recipe.seasoning ? JSON.parse(recipe.seasoning) : [],
      instructions: recipe.instructions ? JSON.parse(recipe.instructions) : [],
      chefTips: recipe.chefTips ? JSON.parse(recipe.chefTips) : [],
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
      language: lang
    }, {
      headers: createCorsHeaders()
    });

  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * 从 Cloudflare Worker API 获取管理员菜谱
 */
async function getAdminRecipesFromWorker(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // 构建查询参数
  const params = new URLSearchParams();
  params.append('limit', searchParams.get('limit') || '10');
  params.append('offset', searchParams.get('offset') || '0');
  params.append('lang', searchParams.get('lang') || 'en');
  if (searchParams.get('search')) params.append('search', searchParams.get('search')!);
  if (searchParams.get('cuisineId')) params.append('cuisineId', searchParams.get('cuisineId')!);

  const workerUrl = getWorkerApiUrl(`/api/recipes/admin?${params}`);
  console.log('Calling Worker API:', workerUrl);

  try {
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