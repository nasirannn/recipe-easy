/**
 * 分类API路由
 * 
 * 处理分类列表的获取
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
      
      // 查询分类和国际化信息
      const sql = `
        SELECT 
          c.id,
          c.slug,
          COALESCE(c18n.name, c.name) as category_name
        FROM ingredient_categories c
        LEFT JOIN ingredient_categories_i18n c18n ON c.id = c18n.category_id AND c18n.language_code = ?
        ORDER BY c.name ASC
      `;
      
      const categories = await db.prepare(sql).bind(lang).all();
      
      const formattedCategories = categories.results.map((category: any) => ({
        id: category.id,
        slug: category.slug,
        name: category.category_name
      }));
      
      return NextResponse.json({
        success: true,
        results: formattedCategories,
        total: formattedCategories.length,
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
  // 获取分类列表
  
  try {
    // 直接查询数据库
    return await getDataFromDatabase(request);
  } catch (error) {
    // 获取分类失败
    return NextResponse.json(
      { error: '数据库服务不可用' },
      { status: 503 }
    );
  }
} 