import axios from 'axios';
import { IMAGE_GEN_CONFIG, APP_CONFIG } from '../config';

export type ImageStyle = typeof IMAGE_GEN_CONFIG.WANX.STYLES[number];
export type ImageSize = typeof IMAGE_GEN_CONFIG.WANX.SIZES[number];
export type ImageModel = 'wanx' | 'flux'; // 添加flux模型类型

export type ImageGenParams = {
  prompt: string;
  negativePrompt?: string;
  style?: ImageStyle;
  size?: ImageSize;
  n?: number; // 生成图片数量
  model?: ImageModel; // 使用的模型
};

export type ImageGenResponse = {
  success: boolean;
  imageUrl?: string; // 兼容旧代码，返回第一张图片URL
  images?: string[]; // 所有图片URL数组
  error?: string;
  taskId?: string; // 用于异步轮询
  status?: string; // 任务状态
};

/**
 * 提交图片生成任务
 * @param params 图片生成参数
 * @returns 包含任务ID的响应对象
 */
export async function generateImage(params: ImageGenParams): Promise<ImageGenResponse> {
  try {
    const model = params.model || APP_CONFIG.DEFAULT_IMAGE_MODEL; // 使用配置文件中的默认图片模型
    const n = params.n ? Math.min(Math.max(1, params.n), 
      model === 'wanx' ? IMAGE_GEN_CONFIG.WANX.MAX_IMAGES : IMAGE_GEN_CONFIG.REPLICATE.MAX_IMAGES) : 1;
    
    // 如果没有提供负面提示词，使用默认配置
    const negativePrompt = params.negativePrompt || 
      (model === 'wanx' ? IMAGE_GEN_CONFIG.NEGATIVE_PROMPTS.WANX : IMAGE_GEN_CONFIG.NEGATIVE_PROMPTS.FLUX);
    
    const response = await axios.post('/api/generate-image', {
      ...params,
      negativePrompt,
      model,
      n
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error submitting image generation task:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Image generation task submission failed'
    };
  }
}

/**
 * 检查图片生成任务的状态
 * @param taskId 任务ID
 * @param model 模型类型
 * @returns 包含任务状态和图片URL（如果完成）的响应对象
 */
export async function checkImageStatus(taskId: string, model: ImageModel = 'wanx'): Promise<ImageGenResponse> {
  try {
    const response = await axios.get(`/api/generate-image/status/${taskId}?model=${model}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error checking task status for ${taskId}:`, error);
    return {
      success: false,
      status: 'FAILED',
      error: error.response?.data?.error || 'Failed to check task status'
    };
  }
}

/**
 * 基于菜谱描述生成图片的提示词
 * @param recipe 菜谱信息
 * @param model 图片生成模型
 * @returns 格式化的提示词
 */
export function generateRecipeImagePrompt(recipe: { 
  name: string; 
  description?: string; 
  ingredients?: string[];
}, model: ImageModel = APP_CONFIG.DEFAULT_IMAGE_MODEL): string {
  const { name, ingredients } = recipe;
  
  // 基础提示词
  let prompt = model === 'wanx' 
    ? `美食照片：${name}` // 中文提示词更适合万象模型
    : `Professional food photograph of ${name}`; // 英文提示词更适合其他模型
  
  if (ingredients && ingredients.length > 0) {
    // 提取核心食材名称，避免量词等其他词语干扰
    const mainIngredients = ingredients.map(ing => ing.split(' ')[0].split('(')[0]); 
    prompt += model === 'wanx'
      ? `。主要原料：${mainIngredients.slice(0, 3).join('、')}`
      : ` with ${mainIngredients.slice(0, 3).join(', ')}`;
  }
  
  // 添加一些通用的描述，提高图片质量和合规性
  if (model === 'wanx') {
    prompt += '。背景干净简约，突出主体，高清晰度特写镜头，柔和自然光线下拍摄，展现食材的质感与色彩层次，营造温暖诱人的食欲氛围。';
  } else {
    prompt += '. Clean and minimalist background, highlighting the subject, high-definition close-up shot, captured under soft natural lighting to showcase the texture and color layers of the ingredients, creating a warm and appetizing atmosphere.';
  }
  
  return prompt;
}

/**
 * 轮询任务状态的工具函数
 * @param taskId 任务ID
 * @param model 图片生成模型
 * @returns 成功时返回图片URL，失败时返回null
 */
export async function pollTaskStatus(taskId: string, model: ImageModel): Promise<string | null> {
  let attempts = 0;
  const maxAttempts = IMAGE_GEN_CONFIG.POLLING.MAX_ATTEMPTS;
  const interval = IMAGE_GEN_CONFIG.POLLING.INTERVAL_MS;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, interval));
    const statusResult = await checkImageStatus(taskId, model);
    
    

    if (statusResult.status === 'SUCCEEDED') {
      
      return statusResult.imageUrl || null;
    }
    
    if (statusResult.status === 'FAILED') {
      console.error(`图片生成任务失败: ${statusResult.error}`);
      return null;
    }
    
    // 如果是 PENDING 或 RUNNING，继续轮询
    attempts++;
  }

  console.error(`图片生成任务超时: ${taskId}`);
  return null;
}

/**
 * 直接基于菜谱信息生成图片
 * @param recipe 菜谱信息
 * @param style 图片风格
 * @param model 生成模型
 * @param n 生成图片数量
 * @returns 生成的图片URL或null
 */
export async function generateImageForRecipe(recipe: { 
  name: string; 
  description?: string; 
  ingredients?: string[];
}, style: ImageStyle = 'photographic', model: ImageModel = APP_CONFIG.DEFAULT_IMAGE_MODEL, n: number = 1): Promise<string | null> {
  try {
    const prompt = generateRecipeImagePrompt(recipe, model);

    
    // 使用配置中定义的负面提示词
    const negativePrompt = model === 'wanx' 
      ? IMAGE_GEN_CONFIG.NEGATIVE_PROMPTS.WANX
      : IMAGE_GEN_CONFIG.NEGATIVE_PROMPTS.FLUX;
    
    const submitResult = await generateImage({
      prompt,
      style: model === 'wanx' ? style : undefined, // style仅对万象模型有效
      model,
      n: Math.min(n, model === 'flux' ? IMAGE_GEN_CONFIG.REPLICATE.MAX_IMAGES : IMAGE_GEN_CONFIG.WANX.MAX_IMAGES),
      negativePrompt
    });
    
    if (!submitResult.success || !submitResult.taskId) {
      console.error('Failed to submit image generation task:', submitResult.error);
      return null;
    }

    const taskId = submitResult.taskId;
    

    // 使用轮询工具函数检查任务状态
    return await pollTaskStatus(taskId, model);

  } catch (error) {
    console.error('Error generating recipe image:', error);
    return null;
  }
}