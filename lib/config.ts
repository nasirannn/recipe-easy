export const API_CONFIG = {
  DEEPSEEK: {
    BASE_URL: 'https://api.deepseek.com',
    MODEL: 'deepseek-chat',
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.7
  },
  QWENPLUS: {
    BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    MODEL: 'qwen-plus',
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.7
  },
  GPT4O_MINI: {
    BASE_URL: 'https://api.replicate.com/v1',
    VERSION: 'openai/gpt-4o-mini:2c0a6a34916017ceafaaf5fdf63f9370cf9491866a9611f37d86138c8ef53fc6',
    TEMPERATURE: 0.7,
    MAX_TOKENS: 4000
  }
} as const;

export const IMAGE_GEN_CONFIG = {
  WANX: {
    // 修正API URL，去掉多余路径
    BASE_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
    MODEL: 'wanx2.1-t2i-turbo',
    STYLES: ['photographic', 'anime', 'oil_painting'] as const,
    SIZES: [
      '1024*1024', 
      '720*1280', 
      '1280*720', 
      '576*1024', 
      '1024*576'
    ] as const,
    MAX_IMAGES: 4 // 单次生成最多4张图片
  },
  REPLICATE: {
    BASE_URL: 'https://api.replicate.com/v1',
    MODEL_ID: 'black-forest-labs/flux-schnell',
    VERSION: '8f650a20e68cf347b2b193ac1cbdfb7c0d173aaa27b584012112fd5cdfcebed4',
    MAX_IMAGES: 4 // Replicate API免费账户限制
  },
  // 统一定义负面提示词
  NEGATIVE_PROMPTS: {
    WANX: 'low quality, blurry, cartoon, animation, anime, drawing, painting, sketch, watermark, signature, text',
    FLUX: 'low quality, bad anatomy, bad hands, cropped image, out of frame, poorly drawn face, distorted face, disfigured, deformed body, blurry, ugly, unrealistic'
  },
  // 统一定义轮询配置
  POLLING: {
    INTERVAL_MS: 2000, // 轮询间隔时间（毫秒）
    MAX_ATTEMPTS: 30,  // 最大尝试次数
    TIMEOUT_MS: 60000  // 总超时时间（毫秒）
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
  CUISINE_TYPES: [
    'Chinese',
    'Italian', 
    'Japanese',
    'Korean',
    'Thai',
    'Indian',
    'Mexican',
    'French',
    'American',
    'British',
    'Mediterranean'
  ] as const
} as const;
