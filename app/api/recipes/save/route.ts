/**
 * 保存菜谱API路由
 * 
 * 处理菜谱保存到数据库，包含完整的图片处理功能和自动翻译
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
  language?: string; // 添加语言字段
}

// 标准化菜谱数据
function normalizeRecipeForDatabase(recipe: any) {
  return {
    ...recipe,
    cookingTime: recipe.cookingTime || recipe.cooking_time,
    chefTips: recipe.chefTips || recipe.chef_tips || []
  };
}

// 异步翻译菜谱（不等待结果）
async function triggerRecipeTranslation(recipe: any, targetLanguage: string, db: any, env: any): Promise<void> {
  try {
    console.log(`🔄 Starting translation for recipe ${recipe.id} to ${targetLanguage}`);
    
    // 使用翻译服务进行翻译
    const { translateRecipeAsync } = await import('@/lib/services/translation');
    await translateRecipeAsync(recipe, targetLanguage, db, env);
    
    console.log(`✅ Translation completed for recipe ${recipe.id}`);
  } catch (error) {
    console.error(`❌ Recipe translation failed for ${recipe.id} to ${targetLanguage}:`, error);
    // 不抛出错误，避免影响主要业务逻辑
  }
}

// 保存菜谱到数据库
async function saveRecipeToDatabase(request: NextRequest) {
  try {
    // 保存菜谱到数据库

    // 获取Cloudflare环境
    const { env, cf, ctx } = await getCloudflareContext();
    const db = env.RECIPE_EASY_DB;
    const imagesBucket = env.RECIPE_IMAGES;

    if (!db) {
      throw new Error('数据库绑定不可用');
    }

    const body: SaveRecipeRequest = await request.json();
    const { recipe, recipes, userId, language } = body;

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
    const newlySavedRecipes = []; // 记录新保存的菜谱，用于后续翻译

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
            console.error(`Failed to update image for recipe ${recipeData.id}:`, error);
          }
        }

        // 添加到已存在的菜谱列表（即使没有更新图片）
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
          console.error(`Failed to save image for recipe ${recipeData.id}:`, error);
          // 图片保存失败不影响菜谱保存
        }
      }

      // 添加到保存的菜谱列表
      savedRecipes.push(normalizeRecipeForDatabase(recipeData));
      newlySavedRecipes.push(recipeData); // 记录新保存的菜谱
    }

    // 如果有新保存的菜谱，立即触发翻译（异步执行）
    let translationPromise: Promise<void> | null = null;
    
    if (newlySavedRecipes.length > 0) {
      console.log(`🔄 Starting translation for ${newlySavedRecipes.length} newly saved recipes...`);
      console.log(`📝 Newly saved recipes:`, newlySavedRecipes.map(r => ({ id: r.id, title: r.title })));
      
      // 添加环境变量检查
      console.log(`🔑 Environment check:`);
      console.log(`   - QWENPLUS_API_KEY: ${(env as any)?.QWENPLUS_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
      console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
      console.log(`   - Request language: ${language || 'undefined'}`);
      
      // 创建翻译 Promise
      translationPromise = (async () => {
        try {
          console.log(`🔄 Processing translation for ${newlySavedRecipes.length} recipes...`);
          
          // 为每个新保存的菜谱触发翻译
          const translationPromises = [];
          
          for (const savedRecipe of newlySavedRecipes) {
            // 使用传递的语言参数，如果没有则默认为英文
            const sourceLanguage = language || 'en';
            const targetLanguage = sourceLanguage === 'zh' ? 'en' : 'zh';
            
            console.log(`🔄 Translating recipe ${savedRecipe.id}:`);
            console.log(`   - Title: "${savedRecipe.title}"`);
            console.log(`   - Source language: ${sourceLanguage}`);
            console.log(`   - Target language: ${targetLanguage}`);
            console.log(`   - Ingredients count: ${(savedRecipe.ingredients || []).length}`);
            console.log(`   - Instructions count: ${(savedRecipe.instructions || []).length}`);
            
            // 创建翻译 Promise
            const translationPromise = triggerRecipeTranslation(
              {
                id: savedRecipe.id,
                title: savedRecipe.title,
                description: savedRecipe.description,
                difficulty: savedRecipe.difficulty,
                servings: savedRecipe.servings,
                cookingTime: savedRecipe.cookingTime || savedRecipe.cooking_time,
                ingredients: savedRecipe.ingredients || [],
                seasoning: savedRecipe.seasoning || [],
                instructions: savedRecipe.instructions || [],
                chefTips: savedRecipe.chefTips || savedRecipe.chef_tips || [],
                tags: savedRecipe.tags || [],
                language: sourceLanguage
              },
              targetLanguage,
              db,
              env
            ).then(() => {
              console.log(`✅ Translation completed for recipe ${savedRecipe.id}`);
            }).catch((error) => {
              console.error(`❌ Translation failed for recipe ${savedRecipe.id}:`, error);
              // 添加更详细的错误信息
              if (error instanceof Error) {
                console.error(`   Error message: ${error.message}`);
                console.error(`   Error stack: ${error.stack}`);
              }
            });
            
            translationPromises.push(translationPromise);
          }
          
          // 等待所有翻译完成
          console.log(`⏳ Waiting for ${translationPromises.length} translations to complete...`);
          const results = await Promise.allSettled(translationPromises);
          
          // 统计翻译结果
          const succeeded = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          console.log(`📊 Translation results: ${succeeded} succeeded, ${failed} failed`);
          
          if (failed > 0) {
            console.error(`❌ Failed translations:`, results.filter(r => r.status === 'rejected').map(r => r.reason));
          }
          
          console.log(`✅ All translations processed for ${newlySavedRecipes.length} recipes`);
          
        } catch (error) {
          console.error('Translation processing failed:', error);
          // 翻译失败不影响保存流程
        }
      })();
    } else {
      console.log(`ℹ️ No newly saved recipes to translate`);
    }

    // 准备响应
    const response = NextResponse.json({
      success: true,
      recipes: savedRecipes,
      count: savedRecipes.length,
      alreadyExists,
      hasUpdatedImage
    });

    // 使用 Cloudflare 的 waitUntil 确保翻译任务完成
    if (translationPromise && ctx?.waitUntil) {
      ctx.waitUntil(translationPromise);
    } else if (translationPromise) {
      console.log('⚠️ waitUntil not available, translation may be interrupted');
    }

    return response;

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