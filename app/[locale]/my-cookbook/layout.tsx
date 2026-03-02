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
      title: 'My Cookbook - RecipeEasy',
      description: 'Manage your created and saved recipes on RecipeEasy.',
      path: 'my-cookbook',
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

export default function MyCookbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
