/**
 * 菜谱详情API路由
 * 
 * 处理单个菜谱的获取、更新和删除
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWorkerApiUrl } from '@/lib/config';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 注意：此API路由现在完全依赖Worker API获取数据
// 不再使用本地静态数据

/**
 * GET /api/recipes/[id]
 * 获取单个菜谱
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('locale') || searchParams.get('lang') || 'en';
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    // 检查是否在生产环境中
    let env: any;
    try {
      const { env: cloudflareEnv } = await getCloudflareContext();
      env = cloudflareEnv;
    } catch (error) {
      // 如果不是在 Cloudflare 环境中，使用 process.env
      env = process.env;
    }

    // 如果在生产环境中，直接访问数据库
    if (env.RECIPE_EASY_DB) {
      try {
        const db = env.RECIPE_EASY_DB;
        
        // 根据语言查询不同的表
        const tableName = language === 'zh' ? 'recipes_zh' : 'recipes';
        
        // 根据语言构建查询
        let query: string;
        let bindParams: any[];
        
        if (language === 'zh') {
          // 中文查询
          query = `
            SELECT 
              r.id, r.title, r.description, r.cooking_time, r.servings, r.difficulty,
              rim.image_path as imagePath,
              r.ingredients, r.seasoning, r.instructions, r.chef_tips,
              r.created_at, r.updated_at, r.user_id, r.cuisine_id,
              ri.title as title_zh, ri.description as description_zh,
              ri.ingredients as ingredients_zh, ri.seasoning as seasoning_zh,
              ri.instructions as instructions_zh, ri.chef_tips as chef_tips_zh,
              ri.tags as tags_zh, ri.difficulty as difficulty_zh,
              r.tags
            FROM recipes r
            LEFT JOIN recipes_i18n ri ON r.id = ri.recipe_id AND ri.language_code = 'zh'
            LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
            WHERE r.id = ?
            LIMIT 1
          `;
          bindParams = [id];
        } else {
          // 英文查询 - 需要 JOIN recipes_i18n 表获取英文版本
          query = `
            SELECT 
              r.id, r.title, r.description, r.cooking_time, r.servings, r.difficulty,
              rim.image_path as imagePath,
              r.ingredients, r.seasoning, r.instructions, r.chef_tips,
              r.created_at, r.updated_at, r.user_id, r.cuisine_id,
              r.tags,
              ri.title as title_en, ri.description as description_en,
              ri.ingredients as ingredients_en, ri.seasoning as seasoning_en,
              ri.instructions as instructions_en, ri.chef_tips as chef_tips_en,
              ri.difficulty as difficulty_en, ri.tags as tags_en
            FROM recipes r
            LEFT JOIN recipes_i18n ri ON r.id = ri.recipe_id AND ri.language_code = 'en'
            LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
            WHERE r.id = ?
            LIMIT 1
          `;
          bindParams = [id];
        }
        
        const recipe = await db.prepare(query).bind(...bindParams).first();
        
        if (!recipe) {
          return NextResponse.json(
            { success: false, error: 'Recipe not found' },
            { status: 404 }
          );
        }

        // 处理多语言数据 - 优先使用英文版本
        let processedRecipe = { ...recipe };
        
        if (language === 'en' && recipe.title_en) {
          // 如果有英文版本，优先使用英文内容
          processedRecipe = {
            ...recipe,
            title: recipe.title_en || recipe.title,
            description: recipe.description_en || recipe.description,
            cookingTime: recipe.cooking_time || recipe.cookingTime, // 确保正确映射
            ingredients: recipe.ingredients_en ? JSON.parse(recipe.ingredients_en) : JSON.parse(recipe.ingredients || '[]'),
            seasoning: recipe.seasoning_en ? JSON.parse(recipe.seasoning_en) : JSON.parse(recipe.seasoning || '[]'),
            instructions: recipe.instructions_en ? JSON.parse(recipe.instructions_en) : JSON.parse(recipe.instructions || '[]'),
            chef_tips: recipe.chef_tips_en ? JSON.parse(recipe.chef_tips_en) : JSON.parse(recipe.chef_tips || '[]'),
            difficulty: recipe.difficulty_en || recipe.difficulty,
            tags: recipe.tags_en ? JSON.parse(recipe.tags_en) : (recipe.tags ? JSON.parse(recipe.tags) : [])
          };
        } else if (language === 'zh' && recipe.title_zh) {
          // 如果有中文版本，优先使用中文内容
          processedRecipe = {
            ...recipe,
            title: recipe.title_zh || recipe.title,
            description: recipe.description_zh || recipe.description,
            cookingTime: recipe.cooking_time || recipe.cookingTime, // 确保正确映射
            ingredients: recipe.ingredients_zh ? JSON.parse(recipe.ingredients_zh) : JSON.parse(recipe.ingredients || '[]'),
            seasoning: recipe.seasoning_zh ? JSON.parse(recipe.seasoning_zh) : JSON.parse(recipe.seasoning || '[]'),
            instructions: recipe.instructions_zh ? JSON.parse(recipe.instructions_zh) : JSON.parse(recipe.instructions || '[]'),
            chef_tips: recipe.chef_tips_zh ? JSON.parse(recipe.chef_tips_zh) : JSON.parse(recipe.chef_tips || '[]'),
            difficulty: recipe.difficulty_zh || recipe.difficulty,
            tags: recipe.tags_zh ? JSON.parse(recipe.tags_zh) : (recipe.tags ? JSON.parse(recipe.tags) : [])
          };
        } else {
          // 如果没有对应语言版本，使用默认内容并解析JSON字段
          processedRecipe = {
            ...recipe,
            cookingTime: recipe.cooking_time || recipe.cookingTime, // 确保正确映射
            ingredients: JSON.parse(recipe.ingredients || '[]'),
            seasoning: JSON.parse(recipe.seasoning || '[]'),
            instructions: JSON.parse(recipe.instructions || '[]'),
            chef_tips: JSON.parse(recipe.chef_tips || '[]'),
            tags: recipe.tags ? JSON.parse(recipe.tags) : []
          };
        }

        return NextResponse.json({
          success: true,
          recipe: processedRecipe
        });
      } catch (dbError) {
        // Database error
        // 如果数据库查询失败，回退到 Worker API
      }
    }

    // 回退到 Worker API（开发环境或数据库查询失败时）
    const response = await fetch(getWorkerApiUrl(`/api/recipes/${id}?lang=${language}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json() as any;
    return NextResponse.json(data);

  } catch (error) {
    // Error fetching recipe
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/recipes/[id]
 * 更新菜谱 - 通过Worker API
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // 调用Worker API更新菜谱
    const response = await fetch(getWorkerApiUrl(`/api/recipes/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json() as any;
    return NextResponse.json(data);
  } catch (error) {
    // Error updating recipe
    return NextResponse.json(
      { success: false, error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recipes/[id]
 * 删除菜谱 - 通过Worker API
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as { userId: string };
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // 调用Worker API删除菜谱
    const response = await fetch(getWorkerApiUrl(`/api/recipes/${id}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('Failed to delete recipe');
    }

    const data = await response.json() as any;
    return NextResponse.json(data);
  } catch (error) {
    // Error deleting recipe
    return NextResponse.json(
      { success: false, error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}
