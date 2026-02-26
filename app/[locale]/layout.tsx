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
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PageViewTracker />
      <RouteBackgroundShell locale={locale}>
        <Navbar />
        {children}
      </RouteBackgroundShell>
    </NextIntlClientProvider>
  );
}
