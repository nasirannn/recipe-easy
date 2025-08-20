/**
 * 食材API路由
 * 
 * 处理食材列表的获取
 */

import { NextRequest, NextResponse } from 'next/server';
import { D1Database } from '@cloudflare/workers-types';
import { createCorsHeaders } from '@/lib/utils/cors';
import { getD1Database, isCloudflareWorkers } from '@/lib/utils/database-utils';
import { getWorkerApiUrl } from '@/lib/config';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * OPTIONS /api/ingredients
 * 处理预检请求
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders()
  });
}

/**
 * GET /api/ingredients
 * 获取食材列表
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'en';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Ingredients API called with lang:', lang);

    // 检查是否在 Cloudflare Workers 环境中
    const isWorker = isCloudflareWorkers();
    console.log('Is Cloudflare Workers environment:', isWorker);

    if (isWorker) {
      // 在 Cloudflare Workers 环境中，直接使用数据库
      console.log('Using database directly');
      return await getIngredientsFromDatabase(req);
    } else {
      // 在本地开发环境中，调用 Cloudflare Worker API
      console.log('Using Worker API');
      return await getIngredientsFromWorker(req);
    }

  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ingredients', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: createCorsHeaders()
      }
    );
  }
}

/**
 * 从数据库直接获取食材
 */
async function getIngredientsFromDatabase(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get('lang') || 'en';
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  // 获取数据库实例
  const db = getD1Database();
  
  if (!db) {
    return NextResponse.json(
      { success: false, error: 'Database not available' },
      { 
        status: 500,
        headers: createCorsHeaders()
      }
    );
  }

  // 构建查询SQL
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
  
  const params: any[] = [lang, lang];
  
  if (category) {
    // 分类ID到slug的映射
    const CATEGORY_SLUG_MAP: Record<number, string> = {
      1: 'meat',
      2: 'seafood', 
      3: 'vegetables',
      4: 'fruits',
      5: 'dairy-eggs',
      6: 'grains-bread',
      7: 'nuts-seeds',
      8: 'herbs-spices'
    };
    
    // 创建slug到ID的反向映射
    const SLUG_TO_ID_MAP: Record<string, number> = {};
    Object.entries(CATEGORY_SLUG_MAP).forEach(([id, slug]) => {
      SLUG_TO_ID_MAP[slug] = parseInt(id);
    });
    
    // 尝试将category参数解析为ID或slug
    let categoryId: number | null = null;
    
    // 首先尝试解析为数字ID
    const numericId = parseInt(category);
    if (!isNaN(numericId)) {
      categoryId = numericId;
    } else {
      // 如果不是数字，尝试作为slug查找
      categoryId = SLUG_TO_ID_MAP[category] || null;
    }
    
    if (categoryId !== null) {
      sql += ' WHERE i.category_id = ?';
      params.push(categoryId);
    }
  }
  
  sql += ' ORDER BY COALESCE(i18n.name, i.name) ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await db.prepare(sql).bind(...params).all();
  const ingredients = results || [];

  const formattedIngredients = ingredients.map((ingredient: any) => {
    // 分类ID到slug的映射
    const CATEGORY_SLUG_MAP: Record<number, string> = {
      1: 'meat',
      2: 'seafood', 
      3: 'vegetables',
      4: 'fruits',
      5: 'dairy-eggs',
      6: 'grains-bread',
      7: 'nuts-seeds',
      8: 'herbs-spices'
    };
    
    return {
      id: ingredient.id,
      slug: ingredient.slug,
      name: ingredient.ingredient_name,
      category: {
        id: ingredient.category_id,
        slug: CATEGORY_SLUG_MAP[ingredient.category_id] || 'other',
        name: ingredient.category_name
      }
    };
  });

  return NextResponse.json({
    success: true,
    results: formattedIngredients,
    total: formattedIngredients.length,
    limit,
    offset,
    language: lang
  }, {
    headers: createCorsHeaders()
  });
}

/**
 * 从 Cloudflare Worker API 获取食材
 */
async function getIngredientsFromWorker(req: NextRequest) {
  const { searchParams } = new URL(req.url);

    // 构建查询参数
    const params = new URLSearchParams();
  params.append('lang', searchParams.get('lang') || 'en');
  if (searchParams.get('category')) {
    params.append('category', searchParams.get('category')!);
  }
  if (searchParams.get('limit')) {
    params.append('limit', searchParams.get('limit')!);
  }
  if (searchParams.get('offset')) {
    params.append('offset', searchParams.get('offset')!);
  }

  const workerUrl = getWorkerApiUrl(`/api/ingredients?${params}`);
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