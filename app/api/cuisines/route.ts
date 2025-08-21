/**
 * 菜系API路由
 * 
 * 处理菜系列表的获取
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 直接从数据库获取数据
async function getDataFromDatabase(request: NextRequest) {
  try {
    // 直接查询数据库
    
    const { env } = await getCloudflareContext();
    const db = env.RECIPE_EASY_DB;
    
    if (!db) {
      throw new Error('数据库绑定不可用');
    }
    
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const lang = searchParams.get('lang') || 'en';
      
      // 查询菜系和国际化信息
      const sql = `
        SELECT 
          c.id,
          c.slug,
          COALESCE(c18n.name, c.name) as cuisine_name
        FROM cuisines c
        LEFT JOIN cuisines_i18n c18n ON c.id = c18n.cuisine_id AND c18n.language_code = ?
        ORDER BY c.name ASC
      `;
      
      const cuisines = await db.prepare(sql).bind(lang).all();
      
      const formattedCuisines = cuisines.results.map((cuisine: any) => ({
        id: cuisine.id,
        slug: cuisine.slug,
        name: cuisine.cuisine_name
      }));
      
      return NextResponse.json({
        success: true,
        results: formattedCuisines,
        total: formattedCuisines.length,
        language: lang
      });
    }
    
    return NextResponse.json({ error: '不支持的请求方法' }, { status: 405 });
  } catch (error) {
    // 数据库查询失败
    return NextResponse.json(
      { error: '数据库查询失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // 获取菜系列表
  
  try {
    // 直接查询数据库
    return await getDataFromDatabase(request);
  } catch (error) {
    // 获取菜系失败
    return NextResponse.json(
      { error: '数据库服务不可用' },
      { status: 503 }
    );
  }
} 