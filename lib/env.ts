// 环境配置管理
export const env = {
  // 应用 URL
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://recipe-easy.com',
  
  // Worker URL
  WORKER_URL: process.env.WORKER_URL || 'https://api.recipe-easy.com',
  
  // 环境检测
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// 验证环境配置
export function validateEnv() {
  if (!env.APP_URL) {
    throw new Error('APP_URL environment variable is required');
  }
  
  if (!env.APP_URL.startsWith('http')) {
    throw new Error('APP_URL must be a valid HTTP URL');
  }
}

// 获取 API URL
export function getApiUrl(path: string): string {
  return `${env.APP_URL}${path}`;
}

// 获取 Worker API URL
export function getWorkerApiUrl(path: string): string {
  return `${env.WORKER_URL}${path}`;
} 