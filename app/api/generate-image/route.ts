import { NextRequest } from 'next/server';
import { getImageModelConfig } from '@/lib/config';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 强制动态渲染

// 记录模型使用情况的函数
async function recordModelUsage(
  modelName: string, 
  modelResponseId: string, 
  userId: string,
  transactionId?: string
) {
  try {
    // 检查是否有数据库绑定
    const context = await getCloudflareContext();
    const db = context?.env?.RECIPE_EASY_DB;
    if (!db) {
      return;
    }
    const recordId = crypto.randomUUID();
    
    const stmt = db.prepare(`
      INSERT INTO model_usage_records 
      (id, model_name, model_type, user_id, created_at) 
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    
    await stmt.bind(
      recordId,
      modelName,
      'image',
      userId
    ).run();
    

  } catch (error) {
    console.error('Failed to record model usage:', error);
    // 不要因为记录失败而影响主要功能
  }
}

// 检查用户积分的内部函数
async function checkUserCredits(userId: string, isAdmin: boolean, context: any): Promise<{ credits: number }> {
  if (isAdmin) {
    return { credits: 999999 }; // 管理员无限积分
  }

  try {
    const db = context?.env?.RECIPE_EASY_DB;
    if (!db) {
      throw new Error('Database not available');
    }

    const stmt = db.prepare(`
      SELECT credits FROM user_credits WHERE user_id = ?
    `);
    
    const result = await stmt.bind(userId).first() as { credits: number } | undefined;
    
    if (!result) {
      throw new Error('User not found');
    }
    
    return { credits: result.credits || 0 };
  } catch (error) {
    console.error('Failed to check user credits:', error);
    throw new Error('Failed to fetch user data');
  }
}

// 扣除用户积分的内部函数
async function deductUserCredits(userId: string, amount: number, description: string, context: any): Promise<string | undefined> {
  try {
    const db = context?.env?.RECIPE_EASY_DB;
    if (!db) {
      throw new Error('Database not available');
    }

    const transactionId = crypto.randomUUID();
    
    try {
      // 检查用户积分
      const checkStmt = db.prepare(`
        SELECT credits FROM user_credits WHERE user_id = ?
      `);
      const userResult = await checkStmt.bind(userId).first() as { credits: number } | undefined;
      
      if (!userResult || userResult.credits < amount) {
        throw new Error('Insufficient credits');
      }
      
      const batchResults = await db.batch([
        // 扣除积分
        db.prepare(`
          UPDATE user_credits SET credits = credits - ?, total_spend = total_spend + ? WHERE user_id = ?
        `).bind(amount, amount, userId),
        
        // 记录交易
        db.prepare(`
          INSERT INTO credit_transactions 
          (id, user_id, amount, type, created_at) 
          VALUES (?, ?, ?, 'spend', datetime('now'))
        `).bind(transactionId, userId, amount)
      ]);
      // 验证更新结果
      if (batchResults[0].meta.changes !== 1) {
        throw new Error('Failed to update user credits');
      }
      
      if (batchResults[1].meta.changes !== 1) {
        throw new Error('Failed to record transaction');
      }
      
      return transactionId;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to deduct user credits:', error);
    throw new Error('Failed to deduct credits');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as any;
    const { 
      recipeTitle,
      recipeIngredients,
      userId,
      language = 'en',
      isAdmin = false
    } = body;

    if (!userId) {
      return Response.json({
        success: false,
        error: 'User must be logged in to generate images'
      }, { status: 401 });
    }

    // 获取Cloudflare上下文
    const context = getCloudflareContext();

    // 获取基于语言的图片模型配置
    const imageConfig = getImageModelConfig(language);

    // 检查用户积分（管理员跳过）
    if (!isAdmin) {
      try {
        const userData = await checkUserCredits(userId, isAdmin, context);
        
        if (userData.credits < 1) {
          return Response.json({
            success: false,
            error: 'Insufficient credits. You need at least 1 credit to generate an image.'
          }, { status: 402 });
        }
      } catch (error) {
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch user data'
        }, { status: 500 });
      }
    }

    // 构建提示词
    const ingredientList = Array.isArray(recipeIngredients) 
      ? recipeIngredients.join(', ') 
      : recipeIngredients;
    
    let prompt;
    if (language === 'zh') {
      prompt = `美食照片：${recipeTitle}，主要食材包含${ingredientList}。纯净虚化的极简背景，高清特写镜头，微距视角，高清晰写实风格突出食物细节主体，在柔和自然光下拍摄以展现食材的质感与色彩层次，营造温暖诱人的食欲氛围。`;
    } else {
      prompt = `Professional food photograph of ${recipeTitle}, featuring ingredients ${ingredientList}. Clean and blurred minimalist background, high-definition close-up shot, macro perspective, high-definition realistic style, highlighting the food details, captured under soft natural lighting to showcase the texture and color layers of the ingredients, creating a warm and appetizing atmosphere.`;
    }

    let imageUrl = '';
    let modelUsed = '';
    let modelResponseId = '';

    // 根据语言选择对应的图片模型
    if (language === 'zh') {
      // 使用通义万相
      modelUsed = 'wanx';
      const response = await fetch(imageConfig.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${imageConfig.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify({
          model: imageConfig.model,
          input: {
            prompt: prompt,
            negative_prompt: imageConfig.negativePrompt
          },
          parameters: {
            style: imageConfig.style,
            size: imageConfig.size,
            n: imageConfig.maxImages,
            seed: Math.floor(Math.random() * 1000000),
            width: 1024,
            height: 1024
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Wanx API Error Details
        throw new Error(`Wanx API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json() as any;

      
      if (result.output?.task_id) {
        // 这是异步调用，需要轮询获取结果
        const taskId = result.output.task_id;
        modelResponseId = taskId;
        let attempts = 0;
        
        while (attempts < imageConfig.maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
          
          const statusResponse = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${imageConfig.apiKey}`,
            }
          });
          
          if (statusResponse.ok) {
                      const statusResult = await statusResponse.json() as {
            output?: {
              task_status?: string;
              results?: Array<{ url?: string }>;
            };
          };

          
          if (statusResult.output?.task_status === 'SUCCEEDED' && statusResult.output?.results?.[0]?.url) {
            imageUrl = statusResult.output.results[0].url;
            break;
          } else if (statusResult.output?.task_status === 'FAILED') {
              throw new Error('Wanx image generation failed');
            }
          }
          
          attempts++;
        }
        
        if (!imageUrl) {
          throw new Error('Wanx image generation timeout');
        }
      } else if (result.output?.results?.[0]?.url) {
        // 同步调用结果
        imageUrl = result.output.results[0].url;
        modelResponseId = result.request_id || `wanx_${Date.now()}`;
      } else {
        throw new Error('No image URL returned from Wanx API');
      }

      // 移除这里的 recordModelUsage 调用，避免重复记录
    } else {
      // 使用 Flux
      modelUsed = 'flux';
      const response = await fetch(`${imageConfig.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${imageConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: imageConfig.model,
          input: {
            prompt: prompt,
            negative_prompt: imageConfig.negativePrompt,
            width: 1024,
            height: 1024,
            num_outputs: imageConfig.maxImages,
            guidance_scale: 3.5,
            num_inference_steps: 4
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Flux API Error Details
        throw new Error(`Flux API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const prediction = await response.json() as any;


      if (prediction.error) {
        throw new Error(`Flux API error: ${prediction.error}`);
      }

      modelResponseId = prediction.id;

      // 轮询等待结果
      let attempts = 0;
      let currentPrediction = prediction;
      
      while (currentPrediction.status !== 'succeeded' && currentPrediction.status !== 'failed' && attempts < imageConfig.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`${imageConfig.baseUrl}/predictions/${currentPrediction.id}`, {
          headers: {
            'Authorization': `Token ${imageConfig.apiKey}`,
          }
        });
        
        if (statusResponse.ok) {
          currentPrediction = await statusResponse.json();

        }
        
        attempts++;
      }

      if (currentPrediction.status === 'succeeded' && currentPrediction.output?.[0]) {
        imageUrl = currentPrediction.output[0];
      } else {
        throw new Error(`Flux generation failed: ${currentPrediction.error || 'Unknown error'}`);
      }

    }

    // 扣除积分（管理员跳过）
    let transactionId: string | undefined;
    if (!isAdmin) {
      console.log(`[POST] User ${userId} is not admin, proceeding with credit deduction`);
      try {
        console.log(`[POST] Calling deductUserCredits for user ${userId}`);
        transactionId = await deductUserCredits(userId, 1, 'Image generation', context);
        console.log(`[POST] Successfully deducted 1 credit for user ${userId}, transaction ID: ${transactionId}`);
      } catch (error) {
        // 扣除积分失败，但图片已生成
        // 继续返回图片，但记录错误
        console.error('[POST] Failed to deduct credits for image generation:', error);
        // 这里可以选择是否要抛出错误，取决于业务逻辑
        // throw new Error('Failed to deduct credits');
      }
    } else {
      console.log(`[POST] Admin user ${userId} skipped credit deduction`);
    }

    // 记录模型使用情况（只在这里调用一次）
    console.log(`[POST] Recording model usage for ${modelUsed}, user ${userId}, transaction ${transactionId}`);
    await recordModelUsage(modelUsed, modelResponseId, userId, transactionId);

    return Response.json({
      success: true,
      imageUrl,
      model: modelUsed,
      prompt
    });

  } catch (error) {
    // 图片生成错误
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image'
    }, { status: 500 });
  }
}