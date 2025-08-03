import { NextResponse } from 'next/server';
import axios from 'axios';
import { IMAGE_GEN_CONFIG, APP_CONFIG, getRecommendedModels } from '@/lib/config';
import type { ImageModel } from '@/lib/services/image-service';
import { version } from 'os';

// 强制动态渲染
// 强制动态渲染
export const runtime = 'edge';

export async function POST(request: Request) {
  let finalModel: string = '';
  let language: string = 'en';
  let userId: string = '';
  let isAdmin: boolean = false;
  
  try {
    const { 
      prompt, 
      style = 'photographic', 
      negativePrompt, // 允许覆盖默认的负面提示词
      size = '1024*1024', 
      n = 1,
      model = APP_CONFIG.DEFAULT_IMAGE_MODEL, // 使用配置文件中的默认图片模型
      userId: requestUserId, // 添加用户ID参数
      isAdmin: requestIsAdmin, // 添加管理员标识
      language: requestLanguage = 'en' // 添加语言参数
    } = await request.json();
    
    // 赋值给外部变量以便在catch块中使用
    language = requestLanguage;
    userId = requestUserId;
    isAdmin = requestIsAdmin;
  
    
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    // 检查用户是否登录
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User must be logged in to generate images' }, { status: 401 });
    }
    
    // 检查积分余额（仅非管理员用户）
    if (!isAdmin) {
      const workerUrl = process.env.WORKER_URL || 'https://recipe-easy.annnb016.workers.dev';
      const checkResponse = await fetch(`${workerUrl}/api/user-usage?userId=${userId}&isAdmin=${isAdmin}`);
      
      if (!checkResponse.ok) {
        return NextResponse.json({ success: false, error: 'Failed to check credits' }, { status: 500 });
      }
      
      const checkResult = await checkResponse.json();
      if (!checkResult.success) {
        return NextResponse.json({ success: false, error: 'Failed to check credits' }, { status: 500 });
      }
      
      const availableCredits = checkResult.data?.credits?.credits || 0;
      if (availableCredits < n) {
        return NextResponse.json({ success: false, error: 'Insufficient credits for image generation' }, { status: 402 });
      }
    }
    
    // 如果没有提供负面提示词，使用默认配置
    const finalNegativePrompt = negativePrompt || 
      (model === 'wanx' ? IMAGE_GEN_CONFIG.NEGATIVE_PROMPTS.WANX : IMAGE_GEN_CONFIG.NEGATIVE_PROMPTS.FLUX);
    
    // 根据语言自动选择模型（非管理员用户）
    if (!isAdmin) {
      const recommendedModels = getRecommendedModels(language);
      finalModel = recommendedModels.imageModel;
    } else {
      finalModel = model;
    }

    // 根据所选模型调用不同的API
    if (finalModel === 'wanx') {
      return await generateWithWanx(prompt, style, finalNegativePrompt, size, n, userId, isAdmin);
    } else if (finalModel === 'flux') {
      // 使用Replicate API处理flux模型
      return await generateWithReplicate(prompt, finalNegativePrompt, userId, isAdmin, n);
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported model: ${finalModel}` }, 
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Request details:', {
      model: finalModel,
      language: language,
      userId: userId,
      isAdmin: isAdmin
    });
    
    // 检查是否是环境变量问题
    if (error.message?.includes('API key') || error.message?.includes('token')) {
      console.error('Environment variable issue detected');
      return NextResponse.json(
        { 
          success: false, 
          error: 'API configuration error. Please check environment variables.' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to generate image' 
      },
      { status: 500 }
    );
  }
}

// 使用万象模型生成图像
async function generateWithWanx(
  prompt: string, 
  style: string, 
  negativePrompt: string,
  size: string,
  n: number,
  userId?: string,
  isAdmin?: boolean
) {
  const count = Math.min(Math.max(1, n), IMAGE_GEN_CONFIG.WANX.MAX_IMAGES);
    
  if (!process.env.DASHSCOPE_API_KEY) {
    console.error('DASHSCOPE_API_KEY 环境变量未设置');
    return NextResponse.json({ 
      success: false, 
      error: 'API key is not configured' 
    }, { status: 500 });
  }
  
  const requestBody = {
    model: IMAGE_GEN_CONFIG.WANX.MODEL,
    input: {
      prompt: prompt,
      negative_prompt: negativePrompt,
    },
    parameters: {
      style: IMAGE_GEN_CONFIG.WANX.STYLES.includes(style as any) ? style : 'photographic',
      size: size,
      n: count,
      return_type: "url"
    }
  };
  
  const response = await axios.post(
    IMAGE_GEN_CONFIG.WANX.BASE_URL,
    requestBody,
    {
      headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-DashScope-Async': 'enable' // 启用异步调用
      }
    }
  );

  const taskId = response.data.output.task_id;

  if (!taskId) {
    throw new Error('Failed to get task_id from async submission');
  }

  // 图片生成任务提交成功，扣减积分（仅非管理员用户）
  if (!isAdmin && userId) {
    try {
      const workerUrl = process.env.WORKER_URL || 'https://recipe-easy.annnb016.workers.dev';
      const spendResponse = await fetch(`${workerUrl}/api/user-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'spend',
          amount: n,
          description: `Generated ${n} image(s) with Wanx`
        }),
      });

      if (!spendResponse.ok) {
        console.error('扣减积分失败，但图片生成任务已提交');
      }
    } catch (error) {
      console.error('扣减积分时出错:', error);
    }
  }

  return NextResponse.json({ 
    success: true, 
    taskId: taskId 
  });
}

// 使用Replicate Flux Schnell模型生成图像
async function generateWithReplicate(prompt: string, negativePrompt: string, userId?: string, isAdmin?: boolean, n: number = 1) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ 
      success: false, 
      error: 'Replicate API token is not configured' 
    }, { status: 500 });
  }
  
  const response = await axios.post(
    `${IMAGE_GEN_CONFIG.REPLICATE.BASE_URL}/predictions`,
    {
      version: IMAGE_GEN_CONFIG.REPLICATE.MODEL_ID,  // 使用模型ID而不是版本ID
      input: {
        prompt,
        negative_prompt: negativePrompt
      }
    },
    {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const taskId = response.data.id;

  if (!taskId) {
    throw new Error('Failed to get task ID from Replicate submission');
  }

  // 图片生成任务提交成功，扣减积分（仅非管理员用户）
  if (!isAdmin && userId) {
    try {
      const workerUrl = process.env.WORKER_URL || 'https://recipe-easy.annnb016.workers.dev';
      const spendResponse = await fetch(`${workerUrl}/api/user-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'spend',
          amount: n,
          description: `Generated ${n} image(s) with Flux`
        }),
      });

      if (!spendResponse.ok) {
        console.error('扣减积分失败，但图片生成任务已提交');
      }
    } catch (error) {
      console.error('扣减积分时出错:', error);
    }
  }

  return NextResponse.json({ 
    success: true, 
    taskId: taskId 
  });
}