import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'zh'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Disable locale detection to always use default locale
  localeDetection: false,

  // Don't show locale prefix for default locale
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames, exclude auth routes
  matcher: ['/', '/((?!api|_next|_vercel|auth|.*\\..*).*)']
};
