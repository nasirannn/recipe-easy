// 环境配置管理
export const env = {
  // 统一环境入口：本地与线上都走同一套 URL 配置
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://recipe-easy.com',
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
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined') {
    // 客户端始终使用相对路径，避免跨域和域名差异
    return normalizedPath;
  }

  // 服务端统一使用完整URL
  return `${env.APP_URL}${normalizedPath}`;
}
