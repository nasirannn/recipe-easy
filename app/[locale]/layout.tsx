import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AuthProvider } from '@/contexts/auth-context';
import { Navbar } from '@/components/layout/navbar';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';
import { PageViewTracker } from '@/components/analytics/page-view-tracker';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return generateSeoMetadata({
    title: "RecipeEasy - AI Recipe Generator, Random Recipes, Meal Ideas",
    description: "Stuck on what to cook? Enter your ingredients and get random, AI-generated recipes based on what you have — solve your 'what can I use' problem.",
    path: "/",
    locale,
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
    <AuthProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <PageViewTracker />
        <Navbar />
        {children}
      </NextIntlClientProvider>
    </AuthProvider>
  );
}
