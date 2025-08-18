import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localeDetection: false,
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  // 对于 HEAD 请求，直接返回简单响应，避免复杂的国际化处理
  if (request.method === 'HEAD') {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
  
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/((?!api|_next|_vercel|auth|.*\\..*).*)']
};