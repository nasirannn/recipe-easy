import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { Navbar } from '@/components/layout/navbar';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';
import { PageViewTracker } from '@/components/analytics/page-view-tracker';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  
  return generateSeoMetadata({
    title: "RecipeEasy - AI Recipe Generator, Random Recipes, Meal Ideas",
    description: "Stuck on what to cook? Enter your ingredients and get random, AI-generated recipes based on what you have — with easy cooking steps.",
    path: "/",
    locale,
  });
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <PageViewTracker />
          <Navbar />
          {children}
        </NextIntlClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
// 移除 Edge Runtime 以启用静态生成
