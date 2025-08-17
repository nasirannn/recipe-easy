// ==================== 配置管理系统 ====================

import { ModelConfig } from '@/lib/types';

// ==================== 环境变量获取 ====================

function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

// ==================== 基础配置 ====================

export const APP_CONFIG = {
  name: 'RecipeEasy',
  version: '1.0.0',
  url: getEnv('NEXT_PUBLIC_APP_URL', 'https://recipe-easy.com'),
  workerUrl: getEnv('WORKER_URL', 'https://api.recipe-easy.com'),
  
  // 应用限制
  minIngredients: 2,
  maxRecipeCount: 1,
  defaultLanguage: 'en' as const,
  supportedLanguages: ['en', 'zh'] as const,
  
  // API配置
  apiTimeout: 10000,
  maxRetries: 3,
  
  // 生成配置
  pollingInterval: 2000,
  maxPollingAttempts: 90,
  generationTimeout: 180000,
  
  // 积分配置
  initialCredits: 100,
  generationCost: 1,
  
  // 难度等级
  difficulties: ['Easy', 'Medium', 'Hard'] as const,
} as const;

// ==================== 分类配置 ====================

export const CATEGORIES_CONFIG = {
  meat: { icon: '🥩', color: 'text-red-600' },
  seafood: { icon: '🐟', color: 'text-blue-600' },
  vegetables: { icon: '🥬', color: 'text-green-600' },
  fruits: { icon: '🍎', color: 'text-yellow-600' },
  'dairy-eggs': { icon: '🥚', color: 'text-purple-600' },
  'grains-bread': { icon: '🌾', color: 'text-amber-600' },
  'nuts-seeds': { icon: '🌰', color: 'text-orange-600' },
  'herbs-spices': { icon: '🌿', color: 'text-emerald-600' },
} as const;

// ==================== 轮播配置 ====================

export const CAROUSEL_CONFIG = {
  TOTAL_ITEMS: 6,
  INTERVAL_MS: 3000,
  TRANSITION_DURATION: 1000,
  ITEM_HEIGHT: 32,
} as const;

// ==================== 搜索配置 ====================

export const SEARCH_CONFIG = {
  MAX_RESULTS: 8,
  BLUR_DELAY: 150,
  SCROLL_DELAY: 150,
} as const;

// ==================== AI模型配置 ====================

// 英文环境配置
const ENGLISH_MODELS: Record<string, ModelConfig> = {
  language: {
    model: 'openai/gpt-4o-mini:2c0a6a34916017ceafaaf5fdf63f9370cf9491866a9611f37d86138c8ef53fc6',
    baseUrl: 'https://api.replicate.com/v1',
    apiKey: getEnv('REPLICATE_API_TOKEN'),
    maxTokens: 4000,
    temperature: 0.7,
    supportsJsonFormat: true,
  },
  image: {
    model: 'black-forest-labs/flux-schnell',
    baseUrl: 'https://api.replicate.com/v1',
    apiKey: getEnv('REPLICATE_API_TOKEN'),
    style: 'photographic',
    size: '1024x1024',
    maxImages: 1,
    negativePrompt: 'low quality, blurry, cartoon, animation, anime, drawing, painting, sketch, watermark, signature, text',
    timeout: 180000,
    maxAttempts: 90,
  }
};

// 中文环境配置
const CHINESE_MODELS: Record<string, ModelConfig> = {
  language: {
    model: 'qwen-plus',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: getEnv('QWENPLUS_API_KEY'),
    maxTokens: 4000,
    temperature: 0.7,
    supportsJsonFormat: true,
  },
  image: {
    model: 'wanx2.1-t2i-turbo',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
    apiKey: getEnv('QWENPLUS_API_KEY'),
    style: 'photographic',
    size: '1024*1024',
    maxImages: 1,
    negativePrompt: '低质量, 模糊, 卡通, 动画, 动漫, 绘画, 素描, 水印, 签名, 文字',
    timeout: 180000,
    maxAttempts: 90,
  }
};

// ==================== 配置获取函数 ====================

export function getModels(locale: string): Record<string, ModelConfig> {
  return locale === 'zh' ? CHINESE_MODELS : ENGLISH_MODELS;
}

export function getLanguageModel(locale: string): ModelConfig {
  return getModels(locale).language;
}

export function getImageModel(locale: string): ModelConfig {
  return getModels(locale).image;
}

export function getFallbackModel(locale: string): ModelConfig | null {
  const models = getModels(locale);
  return models.language.fallback || null;
}

// 为了向后兼容，添加这些函数
export function getRecommendedModels(locale: string): Record<string, ModelConfig> {
  return getModels(locale);
}

export function getImageModelConfig(locale: string): ModelConfig {
  return getImageModel(locale);
}

export function getLanguageConfig(locale: string): ModelConfig {
  return getLanguageModel(locale);
}

// ==================== 工具函数 ====================

export function getWorkerApiUrl(path: string): string {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  return `${APP_CONFIG.workerUrl}/${cleanPath}`;
}

export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // 如果是完整URL，直接返回
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // 如果是相对路径，拼接基础URL
  return `${APP_CONFIG.workerUrl}/images/${imagePath}`;
}

// ==================== 环境检测 ====================

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// ==================== 配置验证 ====================

export function validateConfig(): void {
  const requiredEnvVars = [
    'REPLICATE_API_TOKEN',
    'QWENPLUS_API_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && isProduction()) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
  }
} 