/**
 * 管理员菜谱API路由
 * 
 * 处理管理员创建的菜谱的获取
 */

import { NextRequest, NextResponse } from 'next/server';
import { getD1Database } from '@/lib/utils/database-utils';
import { createCorsHeaders } from '@/lib/utils/cors';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin API: Starting request');
    
    const db = getD1Database();
    if (!db) {
      console.error('Admin API: Database not available');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }
    
    console.log('Admin API: Database connected successfully');
    
    // 使用硬编码的管理员ID
    const adminId = '157b6650-29b8-4613-87d9-ce0997106151';
    console.log('Admin API: Using admin ID:', adminId);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const lang = searchParams.get('lang') || 'en';
    
    console.log('Admin API: Query parameters:', { limit, offset, lang });
    
    // 获取管理员菜谱总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM recipes r
      WHERE r.user_id = ?
    `;
    
    const countResult = await db.prepare(countQuery).bind(adminId).first();
    const total = countResult?.total || 0;
    
    console.log('Admin API: Total recipes found:', total);
    
    // 获取管理员菜谱列表，支持国际化
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
    
    const recipesResult = await db.prepare(recipesQuery).bind(lang, adminId, limit, offset).all();
    const recipes = recipesResult.results || [];
    
    console.log('Admin API: Recipes fetched:', recipes.length);
    
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
    
    console.log('Admin API: Successfully processed recipes');
    
    return NextResponse.json({
      success: true,
      data: {
        recipes: transformedRecipes,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < (total as number)
        }
      }
    });
    
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin recipes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 