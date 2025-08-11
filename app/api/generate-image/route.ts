import { NextRequest } from 'next/server';
import { getImageModelConfig, getLanguageConfig } from '@/lib/config';

// 强制动态渲染
export const runtime = 'edge';

// 记录模型使用情况的函数（已禁用，Worker已删除）
async function recordModelUsage(modelName: string, modelResponseId: string, requestDetails: string) {
  // Worker已删除，模型使用记录功能暂时禁用

}

// 获取当前服务器URL
function getServerUrl(request: NextRequest): string {
  // 在开发环境中使用 localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // 在生产环境中，使用环境变量或从请求中推断
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  // 从请求headers中获取host
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // 默认回退
  return 'https://recipe-easy.com';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      recipeTitle,
      recipeDescription,
      recipeIngredients,
      userId,
      isAdmin,
      language = 'en'
    } = body;

    if (!userId) {
      return Response.json({
        success: false,
        error: 'User must be logged in to generate images'
      }, { status: 401 });
    }

    // 获取基于语言的图片模型配置
    const imageConfig = getImageModelConfig(language);
    const languageConfig = getLanguageConfig(language);

    // 检查用户积分（管理员跳过）
    if (!isAdmin) {
      const serverUrl = getServerUrl(request);
      const userResponse = await fetch(`${serverUrl}/api/user-usage?userId=${userId}&isAdmin=${isAdmin}`);
      
      if (!userResponse.ok) {
        return Response.json({
          success: false,
          error: 'Failed to fetch user data'
        }, { status: 500 });
      }
      
      const userData = await userResponse.json();
      
      if (userData.credits < 1) {
        return Response.json({
          success: false,
          error: 'Insufficient credits. You need at least 1 credit to generate an image.'
        }, { status: 402 });
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
        console.error('Wanx API Error Details:', errorText);
        throw new Error(`Wanx API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      
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
            const statusResult = await statusResponse.json();

            
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

      // 记录模型使用情况
      await recordModelUsage(modelUsed, modelResponseId, prompt);
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
        console.error('Flux API Error Details:', errorText);
        throw new Error(`Flux API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const prediction = await response.json();


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

      // 记录模型使用情况
      await recordModelUsage(modelUsed, modelResponseId, prompt);
    }

    // 扣除积分（管理员跳过）
    if (!isAdmin) {
      const serverUrl = getServerUrl(request);
      const deductResponse = await fetch(`${serverUrl}/api/user-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          action: 'spend',
          amount: 1,
          description: 'Image generation'
        })
      });
      
      if (!deductResponse.ok) {
        console.error('Failed to deduct credits, but image was generated');
        // 继续返回图片，但记录错误
      }
    }

    return Response.json({
      success: true,
      imageUrl,
      model: modelUsed,
      prompt
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image'
    }, { status: 500 });
  }
}