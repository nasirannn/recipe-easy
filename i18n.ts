import { getRequestConfig } from 'next-intl/server';

// i18n.ts
export const LOCALES = ['en', 'zh'] as const;
export type Locale = typeof LOCALES[number];

export const defaultLocale: Locale = 'en';

// 可选：语言友好名称
export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'zh': '中文',
};

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;

  const locale = LOCALES.includes(requested as Locale) ? requested : defaultLocale;

  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});