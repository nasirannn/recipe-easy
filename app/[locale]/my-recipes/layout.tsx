import type { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    ...generateSeoMetadata({
      title: 'My Recipes - RecipeEasy',
      description: 'Manage your saved recipes on RecipeEasy.',
      path: 'my-recipes',
      locale: locale === 'en' ? undefined : locale,
    }),
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default function MyRecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
