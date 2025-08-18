import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localeDetection: false,
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // 排除根路径，只匹配带语言前缀的路径和其他页面
  matcher: [
    '/(en|zh)/:path*',
    '/((?!api|_next|_vercel|auth|.*\\..*)(?!$).*)'
  ]
};