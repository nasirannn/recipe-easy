import { NextResponse } from 'next/server';
import axios from 'axios';
import { IMAGE_GEN_CONFIG, APP_CONFIG } from '@/lib/config';
import type { ImageModel } from '@/lib/services/image-service';

// 强制动态渲染
// 强制动态渲染
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { 
      prompt, 
      style = 'photographic', 
      negativePrompt, // 允许覆盖默认的负面提示词
      size = '1024*1024', 
      n = 1,
      model = APP_CONFIG.DEFAULT_IMAGE_MODEL, // 使用配置文件中的默认图片模型
      userId, // 添加用户ID参数
      isAdmin // 添加管理员标识
    } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    // 检查用户是否登录
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User must be logged in to generate images' }, { status: 401 });
    }
    
    // 扣减积分（仅非管理员用户）
    if (!isAdmin) {
      const workerUrl = process.env.WORKER_URL || 'https://recipe-easy.annnb016.workers.dev';
      const spendResponse = await fetch(`${workerUrl}/api/user-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'spend',
          amount: n, // 根据生成的图片数量扣减积分
          description: `Generated ${n} image(s)`
        }),
      });

      if (!spendResponse.ok) {
        const spendResult = await spendResponse.json();
        if (spendResult.message === 'Insufficient credits.') {
          return NextResponse.json({ success: false, error: 'Insufficient credits for image generation' }, { status: 402 });
        }
        console.error('扣减积分失败:', spendResult);
        return NextResponse.json({ success: false, error: 'Failed to process credits' }, { status: 500 });
      }
    }
    
    // 如果没有提供负面提示词，使用默认配置
    const finalNegativePrompt = negativePrompt || 
      (model === 'wanx' ? IMAGE_GEN_CONFIG.NEGATIVE_PROMPTS.WANX : IMAGE_GEN_CONFIG.NEGATIVE_PROMPTS.FLUX);
    
    // 根据所选模型调用不同的API
    if (model === 'wanx') {
      return await generateWithWanx(prompt, style, finalNegativePrompt, size, n);
    } else if (model === 'flux') {
      // 使用Replicate API处理flux模型
      return await generateWithReplicate(prompt, finalNegativePrompt);
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported model: ${model}` }, 
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Image generation error:', error);
    console.error('Error details:', error.response?.data || error.message);
    
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
  n: number
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

  return NextResponse.json({ 
    success: true, 
    taskId: taskId 
  });
}

// 使用Replicate Flux Schnell模型生成图像
async function generateWithReplicate(prompt: string, negativePrompt: string) {
  
  
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN 环境变量未设置');
    return NextResponse.json({ 
      success: false, 
      error: 'Replicate API token is not configured' 
    }, { status: 500 });
  }
  
  const response = await axios.post(
    `${IMAGE_GEN_CONFIG.REPLICATE.BASE_URL}/predictions`,
    {
      version: "black-forest-labs/flux-schnell",  // 不带具体版本ID
      input: {
        prompt,
        negative_prompt: negativePrompt,
        aspect_ratio: "1:1",
        output_format: "png"
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

  return NextResponse.json({ 
    success: true, 
    taskId: taskId 
  });
}