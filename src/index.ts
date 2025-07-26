// Cloudflare Workers 脚本用于处理 D1 数据库访问

export interface Env {
  DB: D1Database;
  RECIPE_IMAGES: R2Bucket;
}

interface Recipe {
  id: number;
  title: string;
  image_url: string;
  description: string;
  tags: string; // JSON string
  cook_time: number;
  servings: number;
  difficulty: string;
  ingredients: string; // JSON string
  seasoning: string; // JSON string
  instructions: string; // JSON string
  chef_tips: string; // JSON string
  created_at?: string;
  updated_at?: string;
}

interface RecipeResponse {
  id: number;
  title: string;
  name: string;
  image_url: string;
  description: string;
  tags: string[];
  cookTime: number;
  servings: number;
  difficulty: string;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  chefTips: string[];
  cuisine?: {
    id: number;
    name: string;
  };
  user_id?: string;
}

// 将数据库记录转换为 API 响应格式
function transformRecipe(dbRecipe: any): RecipeResponse {
  return {
    id: dbRecipe.id,
    title: dbRecipe.title,
    name: dbRecipe.name || dbRecipe.title,
    image_url: dbRecipe.image_url,
    description: dbRecipe.description,
    tags: JSON.parse(dbRecipe.tags),
    cookTime: dbRecipe.cook_time,
    servings: dbRecipe.servings,
    difficulty: dbRecipe.difficulty,
    ingredients: JSON.parse(dbRecipe.ingredients),
    seasoning: JSON.parse(dbRecipe.seasoning),
    instructions: JSON.parse(dbRecipe.instructions),
    chefTips: JSON.parse(dbRecipe.chef_tips),
    cuisine: dbRecipe.cuisine_name ? {
      id: dbRecipe.cuisine_id,
      name: dbRecipe.cuisine_name
    } : undefined,
    user_id: dbRecipe.user_id
  };
}

// 处理 CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders(),
      });
    }

    // 处理图片请求 /images/[filename] - 放在最前面
    const imageMatch = url.pathname.match(/^\/images\/(.+)$/);
    if (imageMatch && request.method === 'GET') {
      try {
        const filename = imageMatch[1];

        // 从 R2 存储桶获取图片
        const object = await env.RECIPE_IMAGES.get(filename);

        if (!object) {
          return new Response('Image not found', {
            status: 404,
            headers: corsHeaders(),
          });
        }

        // 获取文件扩展名来设置正确的 Content-Type
        const ext = filename.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';

        switch (ext) {
          case 'png':
            contentType = 'image/png';
            break;
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg';
            break;
          case 'gif':
            contentType = 'image/gif';
            break;
          case 'webp':
            contentType = 'image/webp';
            break;
        }

        const headers = {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // 缓存一年
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        return new Response(object.body, {
          status: 200,
          headers,
        });

      } catch (error) {
        console.error('Image serving error:', error);
        return new Response('Failed to serve image', {
          status: 500,
          headers: corsHeaders(),
        });
      }
    }

    // 处理 /api/recipes 路径
    if (url.pathname === '/api/recipes' && request.method === 'GET') {
      try {
        const searchParams = url.searchParams;
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');
        const tag = searchParams.get('tag');
        const difficulty = searchParams.get('difficulty');

        let query = 'SELECT r.*, c.name as cuisine_name FROM recipes r LEFT JOIN cuisines c ON r.cuisine_id = c.id';
        let countQuery = 'SELECT COUNT(*) as total FROM recipes r';
        const params: any[] = [];
        const conditions: string[] = [];

        // 添加过滤条件
        if (tag) {
          conditions.push('r.tags LIKE ?');
          params.push(`%"${tag}"%`);
        }

        if (difficulty) {
          conditions.push('r.difficulty = ?');
          params.push(difficulty);
        }

        if (conditions.length > 0) {
          const whereClause = ` WHERE ${conditions.join(' AND ')}`;
          query += whereClause;
          countQuery += whereClause;
        }

        // 添加排序和分页
        query += ' ORDER BY r.id ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        // 执行查询
        const [recipesResult, countResult] = await Promise.all([
          env.DB.prepare(query).bind(...params).all(),
          env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first()
        ]);

        const recipes = recipesResult.results.map((recipe: any) => transformRecipe(recipe as Recipe));
        const total = (countResult as any)?.total || 0;

        return new Response(JSON.stringify({
          success: true,
          data: recipes,
          total,
          limit,
          offset,
          source: 'database'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        });

      } catch (error) {
        console.error('Database query error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch recipes from database',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        });
      }
    }

    // 处理食材查询 /api/ingredients
    if (url.pathname === '/api/ingredients' && request.method === 'GET') {
      try {
        const searchParams = url.searchParams;
        const language = searchParams.get('lang') || 'en';
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = `
          SELECT
            i.id, i.slug, ii.name,
            ic.id as category_id, ic.slug as category_slug, ici.name as category_name,
            i.is_custom, i.user_id
          FROM ingredients i
          JOIN ingredients_i18n ii ON i.id = ii.ingredient_id
          LEFT JOIN ingredient_categories ic ON i.category_id = ic.id
          LEFT JOIN ingredient_categories_i18n ici ON ic.id = ici.category_id AND ici.language_code = ?
          WHERE ii.language_code = ? AND i.is_active = TRUE
        `;

        const params = [language, language];

        if (category) {
          query += ' AND ic.slug = ?';
          params.push(category);
        }

        query += ' ORDER BY ii.name ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const result = await env.DB.prepare(query).bind(...params).all();

        const ingredients = result.results.map((row: any) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          category: row.category_id ? {
            id: row.category_id,
            slug: row.category_slug,
            name: row.category_name || row.category_slug
          } : null,
          is_custom: Boolean(row.is_custom),
          user_id: row.user_id
        }));

        // 获取总数
        let countQuery = `
          SELECT COUNT(*) as total
          FROM ingredients i
          JOIN ingredients_i18n ii ON i.id = ii.ingredient_id
          LEFT JOIN ingredient_categories ic ON i.category_id = ic.id
          WHERE ii.language_code = ? AND i.is_active = TRUE
        `;

        const countParams = [language];
        if (category) {
          countQuery += ' AND ic.slug = ?';
          countParams.push(category);
        }

        const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

        return new Response(JSON.stringify({
          success: true,
          data: ingredients,
          total: (countResult as any)?.total || 0,
          limit,
          offset,
          language,
          source: 'database'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        });

      } catch (error) {
        console.error('Database query error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch ingredients from database',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        });
      }
    }

    // 处理食材分类查询 /api/ingredients/categories
    if (url.pathname === '/api/ingredients/categories' && request.method === 'GET') {
      try {
        const language = url.searchParams.get('lang') || 'en';

        const query = `
          SELECT ic.id, ic.slug, ici.name, ic.sort_order
          FROM ingredient_categories ic
          JOIN ingredient_categories_i18n ici ON ic.id = ici.category_id
          WHERE ici.language_code = ? AND ic.is_active = TRUE
          ORDER BY ic.sort_order ASC
        `;

        const result = await env.DB.prepare(query).bind(language).all();

        const categories = result.results.map((row: any) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          sort_order: row.sort_order
        }));

        return new Response(JSON.stringify({
          success: true,
          data: categories,
          total: categories.length,
          language,
          source: 'database'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        });

      } catch (error) {
        console.error('Database query error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch ingredient categories from database',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        });
      }
    }

    // 处理菜系查询 /api/cuisines
    if (url.pathname === '/api/cuisines' && request.method === 'GET') {
      try {
        const result = await env.DB.prepare('SELECT * FROM cuisines ORDER BY name ASC').all();

        const cuisines = result.results.map((cuisine: any) => ({
          id: cuisine.id,
          name: cuisine.name,
          description: cuisine.description,
          created_at: cuisine.created_at,
          updated_at: cuisine.updated_at
        }));

        return new Response(JSON.stringify({
          success: true,
          data: cuisines,
          total: cuisines.length,
          source: 'database'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        });

      } catch (error) {
        console.error('Database query error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch cuisines from database',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        });
      }
    }

    // 处理单个食谱查询 /api/recipes/[id]
    const recipeIdMatch = url.pathname.match(/^\/api\/recipes\/(\d+)$/);
    if (recipeIdMatch && request.method === 'GET') {
      try {
        const id = parseInt(recipeIdMatch[1]);
        const result = await env.DB.prepare('SELECT r.*, c.name as cuisine_name FROM recipes r LEFT JOIN cuisines c ON r.cuisine_id = c.id WHERE r.id = ?').bind(id).first();
        
        if (!result) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Recipe not found'
          }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders(),
            },
          });
        }

        const recipe = transformRecipe(result as Recipe);

        return new Response(JSON.stringify({
          success: true,
          data: recipe,
          source: 'database'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        });

      } catch (error) {
        console.error('Database query error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch recipe from database',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        });
      }
    }



    // 默认响应
    return new Response('Recipe API - Cloudflare Workers', {
      status: 200,
      headers: corsHeaders(),
    });
  },
};
