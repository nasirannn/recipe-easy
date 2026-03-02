import { Metadata } from 'next';
import { RecipesList } from '@/components/recipe/recipes-list';
import { FooterSection } from '@/components/layout/sections/footer';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';
import { getRecipePreviews } from '@/lib/server/home';

interface ExplorePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ExplorePageProps): Promise<Metadata> {
  const { locale } = await params;

  return generateSeoMetadata({
    title: 'All Recipes - RecipeEasy',
    description: 'Discover delicious recipes from around the world. Browse our collection of AI-generated recipes with step-by-step instructions.',
    path: 'explore',
    locale,
  });
}

export default async function ExplorePage({ params }: ExplorePageProps) {
  const { locale } = await params;

  const initialLimit = 20;
  const { recipes, pagination } = await getRecipePreviews(locale, {
    page: 1,
    limit: initialLimit,
    withImage: true,
  });

  return (
    <>
      <RecipesList
        locale={locale}
        initialRecipes={recipes}
        initialHasMore={pagination.page < pagination.totalPages}
      />
      <FooterSection />
    </>
  );
}
