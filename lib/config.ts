// 配置管理

// 类型定义
export type LanguageModel = 'QWENPLUS' | 'GPT4o_MINI' | 'DEEPSEEK';
export type ImageModel = 'wanx' | 'flux';
export type ImageSize = '1024x1024' | '1024*1024';
export type ImageStyle = 'photographic' | '<photography>';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export const config = {
  // Worker URL - 支持环境变量配置
  workerUrl: process.env.WORKER_URL || 'https://api.recipe-easy.com',
  
  // 其他配置
  apiTimeout: 10000, // 10秒超时
  maxRetries: 3,
};

// 获取完整的API URL
export function getWorkerApiUrl(path: string): string {
  return `${config.workerUrl}${path}`;
}

// 验证配置
export function validateConfig() {
  if (!config.workerUrl) {
    throw new Error('WORKER_URL environment variable is required');
  }
  
  if (!config.workerUrl.startsWith('http')) {
    throw new Error('WORKER_URL must be a valid HTTP URL');
  }
}

// 应用基础配置
export const APP_CONFIG = {
  MIN_INGREDIENTS: 2,
  DEFAULT_LANGUAGE: 'en' as const,
  DEFAULT_RECIPE_COUNT: 1,
  MAX_RECIPE_COUNT: 1,
  SUPPORTED_LANGUAGES: ['en', 'zh'] as const,
  DIFFICULTY_LEVELS: {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard'
  } as const,
  POLLING: {
    INTERVAL_MS: 2000,
    MAX_ATTEMPTS: 90,
    TIMEOUT_MS: 180000
  }
} as const;

// 🎯 统一的语言配置 - 核心配置！
export const LANGUAGE_CONFIGS = {
  // 英文配置
  en: {
    language: {
      model: 'openai/gpt-4o-mini:2c0a6a34916017ceafaaf5fdf63f9370cf9491866a9611f37d86138c8ef53fc6',
      baseUrl: 'https://api.replicate.com/v1',
      apiKey: process.env.REPLICATE_API_TOKEN,
      maxTokens: 4000,
      temperature: 0.7,
      supportsJsonFormat: true
    },
    image: {
      model: 'black-forest-labs/flux-schnell',
      baseUrl: 'https://api.replicate.com/v1',
      apiKey: process.env.REPLICATE_API_TOKEN,
      style: 'photographic',
      size: '1024x1024',
      maxImages: 1,
      negativePrompt: 'low quality, blurry, cartoon, animation, anime, drawing, painting, sketch, watermark, signature, text',
      timeout: 180000,
      maxAttempts: 90
    }
  },
  // 中文配置 - 主模型 Qwen Plus，备选 DeepSeek
  zh: {
    language: {
      model: 'qwen-plus',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: process.env.QWENPLUS_API_KEY,
      maxTokens: 4000,
      temperature: 0.7,
      supportsJsonFormat: true,
      // 🔄 备选模型配置 - DeepSeek 作为中文的备选项
      fallback: {
        model: 'deepseek-chat',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: process.env.DEEPSEEK_API_KEY,
        maxTokens: 4000,
        temperature: 0.7,
        supportsJsonFormat: true
      }
    },
    image: {
      model: 'wanx2.1-t2i-turbo',
      baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      apiKey: process.env.DASHSCOPE_API_KEY,
      style: '<photography>',
      size: '1024*1024',
      maxImages: 1,
      negativePrompt: '低质量，模糊，卡通，动画，动漫，绘图，绘画，素描，水印，签名，文字',
      timeout: 60000,
      maxAttempts: 30
    }
  }
} as const;

// 🚀 简洁的访问函数
export function getLanguageConfig(locale: string) {
  const language = locale.startsWith('zh') ? 'zh' : 'en';
  return LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.en;
}

export function getLanguageModelConfig(locale: string) {
  return getLanguageConfig(locale).language;
}

export function getImageModelConfig(locale: string) {
  return getLanguageConfig(locale).image;
}

// 获取中文语言模型的备选配置
export function getFallbackLanguageModelConfig(locale: string) {
  const language = locale.startsWith('zh') ? 'zh' : 'en';
  if (language === 'zh') {
    return LANGUAGE_CONFIGS.zh.language.fallback;
  }
  return null;
}

// 🔧 前端兼容性 - 仅保留必要的导出
export const IMAGE_GEN_CONFIG = {
  WANX: {
    MAX_IMAGES: LANGUAGE_CONFIGS.zh.image.maxImages,
  },
  FLUX: {
    MAX_IMAGES: LANGUAGE_CONFIGS.en.image.maxImages,
  }
} as const;

// 推荐模型映射（前端需要）
export function getRecommendedModels(locale: string) {
  const language = locale.startsWith('zh') ? 'zh' : 'en';
  return {
    languageModel: language === 'zh' ? 'QWENPLUS' : 'GPT4o_MINI',
    imageModel: language === 'zh' ? 'wanx' : 'flux'
  };
}

// 兼容性导出
export default config;
