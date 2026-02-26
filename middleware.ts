import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createCorsHeaders } from '@/lib/utils/cors';

const intlMiddleware = createMiddleware({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localeDetection: false,  // 禁用自动语言检测
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  // 处理 API 路由的 CORS
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 兼容旧客户端：移除 user-usage 的 isAdmin 查询参数
    if (request.nextUrl.pathname === '/api/user-usage' && request.nextUrl.searchParams.has('isAdmin')) {
      const rewrittenUrl = request.nextUrl.clone();
      rewrittenUrl.searchParams.delete('isAdmin');

      const response = NextResponse.rewrite(rewrittenUrl);
      Object.entries(createCorsHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      response.headers.set('x-legacy-query-stripped', 'isAdmin');
      return response;
    }

    // 兼容旧客户端：admin 列表接口改为通用 recipes 列表
    if (request.nextUrl.pathname === '/api/recipes/admin') {
      const rewrittenUrl = request.nextUrl.clone();
      rewrittenUrl.pathname = '/api/recipes';
      if (!rewrittenUrl.searchParams.get('type')) {
        rewrittenUrl.searchParams.set('type', 'latest');
      }
      if (!rewrittenUrl.searchParams.get('page')) {
        rewrittenUrl.searchParams.set('page', '1');
      }
      if (!rewrittenUrl.searchParams.get('limit')) {
        rewrittenUrl.searchParams.set('limit', '10');
      }

      const response = NextResponse.rewrite(rewrittenUrl);
      Object.entries(createCorsHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      response.headers.set('x-legacy-path-rewritten', '/api/recipes/admin');
      return response;
    }

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: createCorsHeaders()
      });
    }
    
    // 对于其他 API 请求，继续处理
    const response = NextResponse.next();
    
    // 添加 CORS 头
    Object.entries(createCorsHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  // 对于非 API 路由，使用国际化中间件
  return intlMiddleware(request);
}

export const config = {
  // 排除认证回调路径，避免干扰OAuth流程
  matcher: [
    '/((?!_next|_vercel|favicon.ico|auth/callback|.*\\..*).*)'
  ]
};
