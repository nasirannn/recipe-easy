/**
 * 保存菜谱API路由
 * 
 * 处理菜谱保存到数据库，包含完整的图片处理功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { 
  generateSafeImagePath, 
  downloadImageFromUrl, 
  uploadImageToR2, 
  saveImageRecord,
  deleteImageFromR2
} from '@/lib/utils/image-utils';
import { generateImageId } from '@/lib/utils/id-generator';

// 定义请求体类型
interface SaveRecipeRequest {
  recipe?: {
    id: string;
    title: string;
    description?: string;
    cookingTime?: number;
    cooking_time?: number;
    servings?: number;
    difficulty?: string;
    ingredients?: any[];
    seasoning?: any[];
    instructions?: any[];
    tags?: any[];
    chefTips?: any[];
    chef_tips?: any[];
    imagePath?: string;
    imageModel?: string;
    cuisineId?: number;
  };
  recipes?: any[];
  userId: string;
}

// 标准化菜谱数据
function normalizeRecipeForDatabase(recipe: any) {
  return {
    ...recipe,
    cookingTime: recipe.cookingTime || recipe.cooking_time,
    chefTips: recipe.chefTips || recipe.chef_tips || []
  };
}

// 保存菜谱到数据库
async function saveRecipeToDatabase(request: NextRequest) {
  try {
    // 保存菜谱到数据库
    
    // 获取Cloudflare环境
    const { env } = await getCloudflareContext();
    const db = env.RECIPE_EASY_DB;
    const imagesBucket = env.RECIPE_IMAGES;
    
    if (!db) {
      throw new Error('数据库绑定不可用');
    }

    const body: SaveRecipeRequest = await request.json();
    const { recipe, recipes, userId } = body;
    
    if (!userId) {
      throw new Error('Missing userId in request body');
    }
    
    // 支持单个菜谱或菜谱数组，兼容两种数据格式
    let recipeArray;
    if (recipes) {
      recipeArray = Array.isArray(recipes) ? recipes : [recipes];
    } else if (recipe) {
      recipeArray = [recipe];
    } else {
      throw new Error('No recipe data provided');
    }
    
    const savedRecipes = [];
    let hasUpdatedImage = false;
    let alreadyExists = false;
    
    for (const recipeData of recipeArray) {
      // 验证必要字段
      if (!recipeData.id || !recipeData.title) {
        throw new Error('Recipe ID and title are required');
      }

      // 检查菜谱是否已存在
      const existingRecipe = await db.prepare(`
        SELECT r.id, ri.id as image_id, ri.image_path as current_image_path 
        FROM recipes r 
        LEFT JOIN recipe_images ri ON r.id = ri.recipe_id 
        WHERE r.id = ?
      `).bind(recipeData.id).first();
      
      if (existingRecipe) {
        alreadyExists = true;
        
        // 检查图片是否有更新
        const hasNewImage = recipeData.imagePath && recipeData.imagePath !== existingRecipe.current_image_path;
        
        if (hasNewImage && imagesBucket) {
          hasUpdatedImage = true;
          
          try {
            // 生成安全的图片路径
            const path = generateSafeImagePath(userId, recipeData.id);
            
            // 下载新图片
            const imageData = await downloadImageFromUrl(recipeData.imagePath);
            if (imageData) {
                             // 删除旧图片（如果存在）
               if (existingRecipe.current_image_path) {
                 await deleteImageFromR2(imagesBucket as any, String(existingRecipe.current_image_path));
               }
              
              // 上传新图片到R2
              await uploadImageToR2(imagesBucket as any, path, imageData, {
                userId,
                recipeId: recipeData.id,
                imageModel: recipeData.imageModel || 'unknown'
              });
              
              // 保存图片记录到数据库
              await saveImageRecord(db, {
                userId,
                recipeId: recipeData.id,
                imagePath: path,
                imageModel: recipeData.imageModel || 'unknown'
              });
            }
          } catch (error) {
            // Failed to update image for recipe
          }
        }
        
        // 添加到已存在的菜谱列表
        savedRecipes.push(normalizeRecipeForDatabase(recipeData));
        continue; // 跳过插入新菜谱的逻辑
      }
      
      // 插入新菜谱
      await db.prepare(`
        INSERT INTO recipes (
          id, title, description, cooking_time, servings, difficulty, 
          ingredients, seasoning, instructions, tags, chef_tips, 
          user_id, cuisine_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        recipeData.id,
        recipeData.title,
        recipeData.description || '',
        recipeData.cookingTime || recipeData.cooking_time || 30,
        recipeData.servings || 4,
        recipeData.difficulty || 'easy',
        JSON.stringify(recipeData.ingredients || []),
        JSON.stringify(recipeData.seasoning || []),
        JSON.stringify(recipeData.instructions || []),
        JSON.stringify(recipeData.tags || []),
        JSON.stringify(recipeData.chefTips || recipeData.chef_tips || []),
        userId,
        recipeData.cuisineId || 9,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
      
      // 如果菜谱有图片且有R2存储桶，保存图片
      if (recipeData.imagePath && imagesBucket) {
        try {
          // 处理图片
          
          // 下载图片
          const imageData = await downloadImageFromUrl(recipeData.imagePath);
          if (imageData) {
            // 生成安全的图片路径
            const path = generateSafeImagePath(userId, recipeData.id);
            
                                      // 上传到R2
             await uploadImageToR2(imagesBucket as any, path, imageData, {
               userId,
               recipeId: recipeData.id,
               imageModel: recipeData.imageModel || 'unknown'
             });
             
             // 保存图片记录到数据库
             await saveImageRecord(db, {
               userId,
               recipeId: recipeData.id,
               imagePath: path,
               imageModel: recipeData.imageModel || 'unknown'
             });
            
            // 图片保存成功
          }
        } catch (error) {
          // 图片保存失败
          // 图片保存失败不影响菜谱保存
        }
      }
      
      // 添加到保存的菜谱列表
      savedRecipes.push(normalizeRecipeForDatabase(recipeData));
    }

    // 成功保存菜谱

    return NextResponse.json({
      success: true,
      recipes: savedRecipes,
      count: savedRecipes.length,
      alreadyExists,
      hasUpdatedImage
    });
    
  } catch (error) {
    // 保存菜谱失败
    return NextResponse.json(
      { 
        success: false, 
        error: '保存菜谱失败', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes/save
 * 保存菜谱到数据库
 */
export async function POST(req: NextRequest) {
  // 保存菜谱API调用
  
  try {
    return await saveRecipeToDatabase(req);
  } catch (error) {
    // 保存菜谱API错误
    return NextResponse.json(
      { 
        success: false, 
        error: '服务器错误', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 