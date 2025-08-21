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
      const category = searchParams.get('category');
      const limit = parseInt(searchParams.get('limit') || '100');
      const offset = parseInt(searchParams.get('offset') || '0');
      
      // 构建查询SQL
      let sql = `
        SELECT 
          i.id,
          i.slug,
          i.category_id,
          COALESCE(i18n.name, i.name) as ingredient_name,
          COALESCE(c18n.name, c.name) as category_name,
          c.slug as category_slug
        FROM ingredients i
        LEFT JOIN ingredients_i18n i18n ON i.id = i18n.ingredient_id AND i18n.language_code = ?
        LEFT JOIN ingredient_categories c ON i.category_id = c.id
        LEFT JOIN ingredient_categories_i18n c18n ON c.id = c18n.category_id AND c18n.language_code = ?
      `;
      
      let params: (string | number)[] = [lang, lang];
       
      if (category) {
        sql += ' WHERE i.category_id = ?';
        params.push(parseInt(category) || category);
      }
       
      sql += ' ORDER BY i.name ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const ingredients = await db.prepare(sql).bind(...params).all();
      
      const formattedIngredients = ingredients.results.map((ingredient: any) => ({
        id: ingredient.id,
        slug: ingredient.slug,
        name: ingredient.ingredient_name,
        category: {
          id: ingredient.category_id,
          name: ingredient.category_name,
          slug: ingredient.category_slug
        }
      }));
      
      return NextResponse.json({
        success: true,
        results: formattedIngredients,
        total: formattedIngredients.length,
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
  // 获取食材列表
  
  try {
    // 直接查询数据库
    return await getDataFromDatabase(request);
  } catch (error) {
    // 获取食材失败
    return NextResponse.json(
      { error: '数据库服务不可用' },
      { status: 503 }
    );
  }
} 