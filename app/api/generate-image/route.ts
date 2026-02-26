import { NextRequest } from 'next/server';
import { APP_CONFIG, getImageModelConfig } from '@/lib/config';
import {
  ensureCreditsSchema,
  getOrCreateUserCredits,
  spendCredits,
} from '@/lib/server/credits';
import { recordModelUsage } from '@/lib/server/model-usage';
import { getPostgresPool } from '@/lib/server/postgres';
import { supabase } from '@/lib/supabase';

// 强制动态渲染
export const runtime = 'nodejs';

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization') || '';
  if (!value.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return Response.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return Response.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const body = await request.json() as any;
    const { 
      recipeTitle,
      recipeIngredients,
      language = 'en'
    } = body;

    const userId = authData.user.id;

    const db = getPostgresPool();

    await ensureCreditsSchema(db);
    const imageGenerationCost = APP_CONFIG.imageGenerationCost;

    // 获取基于语言的图片模型配置
    const imageConfig = getImageModelConfig(language);

    try {
      const credits = await getOrCreateUserCredits(db, userId);
      if (credits.credits < imageGenerationCost) {
        return Response.json({
          success: false,
          error: `Insufficient credits. You need at least ${imageGenerationCost} credits to generate an image.`
        }, { status: 402 });
      }
    } catch (error) {
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user data'
      }, { status: 500 });
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

    try {
      await spendCredits(db, userId, imageGenerationCost);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      if (details === 'Insufficient credits') {
        return Response.json({
          success: false,
          error: `Insufficient credits. You need at least ${imageGenerationCost} credits to generate an image.`
        }, { status: 402 });
      }
      console.error('[POST] Failed to deduct credits for image generation:', error);
      throw error;
    }

    try {
      await recordModelUsage(db, {
        modelName: modelUsed,
        modelType: 'image',
        userId,
      });
    } catch (error) {
      console.error('Failed to record model usage:', error);
    }

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
