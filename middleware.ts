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