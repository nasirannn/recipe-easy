import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localeDetection: true,
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // 处理所有路径，包括根路径，但排除 API 和静态文件
  matcher: [
    '/((?!api|_next|_vercel|favicon.ico|.*\\..*).*)'
  ]
};