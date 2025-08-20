// 环境配置管理
export const env = {
  // 应用 URL - 开发环境使用本地URL
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 
           (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://recipe-easy.com'),
  
  // Worker URL
  WORKER_URL: process.env.WORKER_URL || 'https://recipe-easy.com',
  
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

// 获取 API URL - 在开发环境中优先使用相对路径
export function getApiUrl(path: string): string {
  if (env.IS_DEVELOPMENT && typeof window !== 'undefined') {
    // 客户端使用相对路径
    return path;
  }
  
  // 服务器端或生产环境使用完整URL
  return `${env.APP_URL}${path}`;
}

// 获取 Worker API URL
export function getWorkerApiUrl(path: string): string {
  return `${env.WORKER_URL}${path}`;
} 