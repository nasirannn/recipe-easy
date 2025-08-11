/**
 * API响应创建工具
 * 统一处理各种API响应格式
 */

import { createCorsHeaders } from './cors';

export interface ApiResponseData<T = any> {
  success: boolean;
  data?: T;
  results?: T[];
  error?: string;
  message?: string;
  details?: string;
  total?: number;
  limit?: number;
  offset?: number;
  language?: string;
  source?: string;
  [key: string]: any;
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T | T[],
  options: {
    message?: string;
    total?: number;
    limit?: number;
    offset?: number;
    language?: string;
    source?: string;
    corsHeaders?: Record<string, string>;
  } = {}
): Response {
  const { message, total, limit, offset, language, source, corsHeaders = createCorsHeaders() } = options;
  
  const responseData: ApiResponseData<T> = {
    success: true,
    message,
    total,
    limit,
    offset,
    language,
    source
  };

  // 根据数据类型设置不同的字段
  if (Array.isArray(data)) {
    responseData.results = data;
    responseData.total = total ?? data.length;
  } else {
    responseData.data = data;
  }

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  error: string,
  statusCode: number = 500,
  details?: string,
  corsHeaders: Record<string, string> = createCorsHeaders()
): Response {
  const responseData: ApiResponseData = {
    success: false,
    error,
    details
  };

  return new Response(JSON.stringify(responseData), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 创建方法不允许响应
 */
export function createMethodNotAllowedResponse(
  corsHeaders: Record<string, string> = createCorsHeaders()
): Response {
  return new Response('Method not allowed', { 
    status: 405,
    headers: corsHeaders 
  });
}

/**
 * 创建健康检查响应
 */
export function createHealthResponse(
  service: string = 'recipe-easy-api',
  corsHeaders: Record<string, string> = createCorsHeaders()
): Response {
  return createSuccessResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service
  }, { corsHeaders });
}

/**
 * 创建根路径响应
 */
export function createRootResponse(
  corsHeaders: Record<string, string> = createCorsHeaders()
): Response {
  return createSuccessResponse({
    message: 'Recipe Easy API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health',
      '/api/categories',
      '/api/ingredients', 
      '/api/cuisines',
      '/api/recipes/public',     // 公开菜谱（推荐）
      '/api/recipes/admin',      // 管理员菜谱（需要权限）
      '/api/recipes',            // 通用菜谱（向后兼容）
      '/api/recipes/user/:userId', // 用户菜谱
      '/api/user-usage'
    ],
    security: {
      note: '建议使用分离的接口以提高安全性',
      public: '/api/recipes/public - 无需权限，只返回公开菜谱',
      admin: '/api/recipes/admin - 需要管理员权限',
      user: '/api/recipes/user/:userId - 获取指定用户的菜谱'
    }
  }, { corsHeaders });
}

/**
 * 创建404响应
 */
export function createNotFoundResponse(
  corsHeaders: Record<string, string> = createCorsHeaders()
): Response {
  return new Response('API endpoint not found', { 
    status: 404,
    headers: corsHeaders 
  });
} 