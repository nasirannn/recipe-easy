import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Navbar } from '@/components/layout/navbar';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';
import { PageViewTracker } from '@/components/analytics/page-view-tracker';
import { RouteBackgroundShell } from '@/components/layout/route-background-shell';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isZh = locale.toLowerCase().startsWith("zh");
  
  return generateSeoMetadata({
    title: isZh
      ? "RecipeEasy - AI 菜谱生成器，随机菜谱与做饭灵感"
      : "RecipeEasy - AI Recipe Generator, Random Recipes, Meal Ideas",
    description: isZh
      ? "输入已有食材，快速获得 AI 生成的随机菜谱和可执行做法，解决每天吃什么的问题。"
      : "Stuck on what to cook? Enter your ingredients and get random, AI-generated recipes based on what you have — solve your 'what can I use' problem.",
    path: "/",
    locale: locale === "en" ? undefined : locale,
  });
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PageViewTracker />
      <RouteBackgroundShell>
        <Navbar />
        {children}
      </RouteBackgroundShell>
    </NextIntlClientProvider>
  );
}
