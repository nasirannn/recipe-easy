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
  // 完全排除根路径，只处理有语言前缀的路径
  matcher: [
    '/(en|zh)/:path*',
    '/((?!api|_next|_vercel|auth|favicon.ico|index.html|.*\\..*)(?!$).*)'
  ]
};