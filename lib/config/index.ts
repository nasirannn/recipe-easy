// ==================== 配置管理系统 ====================

import { 
  LanguageModel, 
  ImageModel, 
  LanguageModelConfig, 
  ImageModelConfig, 
  LanguageConfigSet,
  SupportedLocale
} from '@/lib/types';

// ==================== 环境变量验证 ====================

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

// ==================== 基础配置 ====================

export const BASE_CONFIG = {
  // API配置
  workerUrl: getOptionalEnv('WORKER_URL', 'https://api.recipe-easy.com'),
  apiTimeout: 10000,
  maxRetries: 3,
  
  // 应用配置
  app: {
    name: 'RecipeEasy',
    version: '1.0.0',
    url: getOptionalEnv('NEXT_PUBLIC_APP_URL', 'https://recipe-easy.com'),
    minIngredients: 2,
    defaultLanguage: 'en' as const,
    defaultRecipeCount: 1,
    maxRecipeCount: 1,
    supportedLanguages: ['en', 'zh'] as const,
  },
  
  // 生成配置
  generation: {
    polling: {
      intervalMs: 2000,
      maxAttempts: 90,
      timeoutMs: 180000,
    },
    difficulty: {
      EASY: 'Easy',
      MEDIUM: 'Medium', 
      HARD: 'Hard'
    } as const,
    credits: {
      initial: 100,
      generationCost: 1,
    }
  }
} as const;

// ==================== AI模型配置 ====================

// 英文环境配置
const ENGLISH_CONFIG: LanguageConfigSet = {
  language: {
    model: 'openai/gpt-4o-mini:2c0a6a34916017ceafaaf5fdf63f9370cf9491866a9611f37d86138c8ef53fc6',
    baseUrl: 'https://api.replicate.com/v1',
    apiKey: getOptionalEnv('REPLICATE_API_TOKEN'),
    maxTokens: 4000,
    temperature: 0.7,
    supportsJsonFormat: true,
  },
  image: {
    model: 'black-forest-labs/flux-schnell',
    baseUrl: 'https://api.replicate.com/v1',
    apiKey: getOptionalEnv('REPLICATE_API_TOKEN'),
    style: 'photographic',
    size: '1024x1024',
    maxImages: 1,
    negativePrompt: 'low quality, blurry, cartoon, animation, anime, drawing, painting, sketch, watermark, signature, text',
    timeout: 180000,
    maxAttempts: 90,
  }
};

// 中文环境配置
const CHINESE_CONFIG: LanguageConfigSet = {
  language: {
    model: 'qwen-plus',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: getOptionalEnv('QWENPLUS_API_KEY'),
    maxTokens: 4000,
    temperature: 0.7,
    supportsJsonFormat: true,
    // DeepSeek作为备选模型
    fallback: {
      model: 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: getOptionalEnv('DEEPSEEK_API_KEY'),
      maxTokens: 4000,
      temperature: 0.7,
      supportsJsonFormat: true,
    }
  },
  image: {
    model: 'wanx2.1-t2i-turbo',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
    apiKey: getOptionalEnv('DASHSCOPE_API_KEY'),
    style: '<photography>',
    size: '1024*1024',
    maxImages: 1,
    negativePrompt: '低质量，模糊，卡通，动画，动漫，绘图，绘画，素描，水印，签名，文字',
    timeout: 60000,
    maxAttempts: 30,
  }
};

// ==================== 模型配置映射 ====================

export const LANGUAGE_CONFIGS: Record<SupportedLocale, LanguageConfigSet> = {
  en: ENGLISH_CONFIG,
  zh: CHINESE_CONFIG,
} as const;

// ==================== 配置访问函数 ====================

/**
 * 根据语言环境获取配置
 */
export function getLanguageConfig(locale: string): LanguageConfigSet {
  const language = locale.startsWith('zh') ? 'zh' : 'en';
  return LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.en;
}

/**
 * 获取语言模型配置
 */
export function getLanguageModelConfig(locale: string): LanguageModelConfig {
  return getLanguageConfig(locale).language;
}

/**
 * 获取图片模型配置
 */
export function getImageModelConfig(locale: string): ImageModelConfig {
  return getLanguageConfig(locale).image;
}

/**
 * 获取备选语言模型配置（仅中文有）
 */
export function getFallbackLanguageModelConfig(locale: string): LanguageModelConfig | null {
  const language = locale.startsWith('zh') ? 'zh' : 'en';
  if (language === 'zh') {
    return LANGUAGE_CONFIGS.zh.language.fallback || null;
  }
  return null;
}

/**
 * 根据语言获取推荐的模型
 */
export function getRecommendedModels(locale: string) {
  const language = locale.startsWith('zh') ? 'zh' : 'en';
  return {
    languageModel: language === 'zh' ? 'QWENPLUS' : 'GPT4o_MINI',
    imageModel: language === 'zh' ? 'wanx' : 'flux'
  };
}

// ==================== API URL 构建函数 ====================

/**
 * 构建完整的Worker API URL
 */
export function getWorkerApiUrl(path: string): string {
  const baseUrl = BASE_CONFIG.workerUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * 构建图片URL
 */
export function getImageUrl(imagePath: string): string {
  return getWorkerApiUrl(`/images/${imagePath}`);
}

// ==================== 配置验证函数 ====================

/**
 * 验证基础配置
 */
export function validateConfig(): void {
  if (!BASE_CONFIG.workerUrl) {
    throw new Error('WORKER_URL environment variable is required');
  }
  
  if (!BASE_CONFIG.workerUrl.startsWith('http')) {
    throw new Error('WORKER_URL must be a valid HTTP URL');
  }
}

/**
 * 验证AI模型配置
 */
export function validateAIConfig(locale: string): void {
  const config = getLanguageConfig(locale);
  
  if (!config.language.apiKey) {
    throw new Error(`Language model API key not configured for locale: ${locale}`);
  }
  
  if (!config.image.apiKey) {
    throw new Error(`Image model API key not configured for locale: ${locale}`);
  }
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// ==================== 兼容性导出 ====================

// 保持与原有代码的兼容性
export const config = BASE_CONFIG;
export const APP_CONFIG = BASE_CONFIG.app;
export const IMAGE_GEN_CONFIG = {
  WANX: {
    MAX_IMAGES: LANGUAGE_CONFIGS.zh.image.maxImages,
  },
  FLUX: {
    MAX_IMAGES: LANGUAGE_CONFIGS.en.image.maxImages,
  }
} as const;

// 类型导出
export type { 
  LanguageModel, 
  ImageModel, 
  LanguageModelConfig, 
  ImageModelConfig, 
  SupportedLocale 
} from '@/lib/types';

// 默认导出
export default BASE_CONFIG; 