/**
 * 分类API路由
 * 
 * 处理分类列表的获取
 */

import { NextRequest, NextResponse } from 'next/server';
import { D1Database } from '@cloudflare/workers-types';
import { createCorsHeaders } from '@/lib/utils/cors';
import { getD1Database, isCloudflareWorkers } from '@/lib/utils/database-utils';
import { getWorkerApiUrl } from '@/lib/config';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * OPTIONS /api/categories
 * 处理预检请求
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders()
  });
}

/**
 * GET /api/categories
 * 获取分类列表
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'en';

    console.log('Categories API called with lang:', lang);

    // 检查是否在 Cloudflare Workers 环境中
    const isWorker = isCloudflareWorkers();
    console.log('Is Cloudflare Workers environment:', isWorker);

    if (isWorker) {
      // 在 Cloudflare Workers 环境中，直接使用数据库
      console.log('Using database directly');
      return await getCategoriesFromDatabase(req);
    } else {
      // 在本地开发环境中，调用 Cloudflare Worker API
      console.log('Using Worker API');
      return await getCategoriesFromWorker(req);
    }

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: createCorsHeaders()
      }
    );
  }
}

/**
 * 从数据库直接获取分类
 */
async function getCategoriesFromDatabase(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get('lang') || 'en';

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

  // 查询分类数据
  const { results } = await db.prepare(`
    SELECT 
      c.id,
      COALESCE(c18n.name, c.name) as category_name
    FROM ingredient_categories c
    LEFT JOIN ingredient_categories_i18n c18n ON c.id = c18n.category_id AND c18n.language_code = ?
    ORDER BY c.id ASC
  `).bind(lang).all();

  const categories = results || [];
  const formattedCategories = categories.map((category: any) => ({
    id: category.id,
    name: category.category_name
  }));

  return NextResponse.json({
    success: true,
    results: formattedCategories,
    total: formattedCategories.length,
    language: lang
  }, {
    headers: createCorsHeaders()
  });
}

/**
 * 从 Cloudflare Worker API 获取分类
 */
async function getCategoriesFromWorker(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // 构建查询参数
  const params = new URLSearchParams();
  params.append('lang', searchParams.get('lang') || 'en');

  const workerUrl = getWorkerApiUrl(`/api/categories?${params}`);
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