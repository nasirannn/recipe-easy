/**
 * 菜系API路由
 * 
 * 处理菜系列表的获取
 */

import { NextRequest, NextResponse } from 'next/server';
import { getD1Database } from '@/lib/utils/database-utils';
import { createCorsHeaders } from '@/lib/utils/cors';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * OPTIONS /api/cuisines
 * 处理预检请求
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders()
  });
}

/**
 * GET /api/cuisines
 * 获取菜系列表
 */
export async function GET(req: NextRequest) {
  try {
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

    // 查询菜系数据
    const { results } = await db.prepare(`
      SELECT 
        c.id,
        c.name as cuisine_name,
        c.slug as cuisine_slug,
        c.css_class,
        COALESCE(c18n.name, c.name) as localized_cuisine_name,
        COALESCE(c18n.slug, c.slug) as localized_cuisine_slug,
        c18n.language_code
      FROM cuisines c
      LEFT JOIN cuisines_i18n c18n ON c.id = c18n.cuisine_id AND c18n.language_code = ?
      ORDER BY c.id ASC
    `).bind(lang).all();

    const cuisines = results || [];
    const formattedCuisines = cuisines.map((cuisine: any) => ({
      id: cuisine.id,
      name: cuisine.localized_cuisine_name || cuisine.cuisine_name,
      slug: cuisine.localized_cuisine_slug || cuisine.cuisine_slug,
      cssClass: cuisine.css_class
    }));

      return NextResponse.json({
      success: true,
      results: formattedCuisines,
      total: formattedCuisines.length,
      language: lang
    }, {
      headers: createCorsHeaders()
    });

  } catch (error) {
    console.error('Error fetching cuisines:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cuisines' },
      { 
        status: 500,
        headers: createCorsHeaders()
      }
    );
  }
} 