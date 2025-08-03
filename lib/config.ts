// 配置管理
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

export const API_CONFIG = {
  DEEPSEEK: {
    BASE_URL: 'https://api.deepseek.com',
    MODEL: 'deepseek-chat',
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.7,
    API_KEY: process.env.DEEPSEEK_API_KEY
  },
  QWENPLUS: {
    BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    MODEL: 'qwen-plus',
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.7,
    API_KEY: process.env.QWENPLUS_API_KEY
  },
  GPT4o_MINI: {
    BASE_URL: 'https://api.replicate.com/v1',
    MODEL: 'openai/gpt-4o-mini:2c0a6a34916017ceafaaf5fdf63f9370cf9491866a9611f37d86138c8ef53fc6',
    TEMPERATURE: 0.7,
    MAX_TOKENS: 4000,
    API_KEY: process.env.REPLICATE_API_TOKEN
  }
} as const;

export const IMAGE_GEN_CONFIG = {
  WANX: {
    // 修正API URL，去掉多余路径
    BASE_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
    MODEL: 'wanx2.1-t2i-turbo',
    STYLES: ['photographic'] as const,
    SIZES: [
      '1024*1024', 
      '720*1280', 
      '1280*720', 
      '576*1024', 
      '1024*576'
    ] as const,
    MAX_IMAGES: 1 // 单次生成最多4张图片
  },
  REPLICATE: {
    BASE_URL: 'https://api.replicate.com/v1',
    MODEL_ID: 'black-forest-labs/flux-schnell',
    MAX_IMAGES: 1 // Replicate API免费账户限制
  },
  // 统一定义负面提示词
  NEGATIVE_PROMPTS: {
    WANX: 'low quality, blurry, cartoon, animation, anime, drawing, painting, sketch, watermark, signature, text',
    FLUX: 'low quality, bad anatomy, bad hands, cropped image, out of frame, poorly drawn face, distorted face, disfigured, deformed body, blurry, ugly, unrealistic'
  },
  // 统一定义轮询配置
  POLLING: {
    INTERVAL_MS: 2000, // 轮询间隔时间（毫秒）
    MAX_ATTEMPTS: 90,  // 最大尝试次数（增加到90次，总共3分钟）
    TIMEOUT_MS: 180000  // 总超时时间（毫秒）- 增加到3分钟
  },
  // 针对不同模型的超时配置
  MODEL_TIMEOUTS: {
    WANX: {
      MAX_ATTEMPTS: 30,  // 万象模型：60秒
      TIMEOUT_MS: 60000
    },
    FLUX: {
      MAX_ATTEMPTS: 90,  // Flux模型：3分钟
      TIMEOUT_MS: 180000
    }
  }
} as const;

export const APP_CONFIG = {
  MIN_INGREDIENTS: 2,
  DEFAULT_LANGUAGE: 'en' as const,
  DEFAULT_RECIPE_COUNT: 1,
  MAX_RECIPE_COUNT: 4,
  SUPPORTED_LANGUAGES: ['en', 'zh'] as const,
  // 默认模型配置
  DEFAULT_LANGUAGE_MODEL: 'qwenplus' as const,
  DEFAULT_IMAGE_MODEL: 'wanx' as const,
  DIFFICULTY_LEVELS: {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
  } as const,
} as const;

// 新增：基于语言的自动模型选择
export const LANGUAGE_MODEL_MAPPING = {
  zh: {
    languageModel: 'qwenplus' as const,
    imageModel: 'wanx' as const
  },
  en: {
    languageModel: 'gpt4o_mini' as const,
    imageModel: 'flux' as const
  }
} as const;

// 获取基于语言的推荐模型
export function getRecommendedModels(locale: string) {
  const language = locale.startsWith('zh') ? 'zh' : 'en';
  return LANGUAGE_MODEL_MAPPING[language] || LANGUAGE_MODEL_MAPPING.en;
}
