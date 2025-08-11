/**
 * 精简的CORS工具库
 * 只保留项目实际使用的功能
 */

/**
 * 创建CORS头
 * 这是项目实际使用的唯一CORS功能
 */
export function createCorsHeaders(origin?: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
} 