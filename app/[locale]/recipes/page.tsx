import { Metadata } from 'next';
import { RecipesList } from '@/components/recipe/recipes-list';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';

interface RecipesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: RecipesPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return generateSeoMetadata({
    title: 'All Recipes - RecipeEasy',
    description: 'Discover delicious recipes from around the world. Browse our collection of AI-generated recipes with step-by-step instructions.',
    path: 'recipes',
    locale,
  });
}

export default async function RecipesPage({ params }: RecipesPageProps) {
  const { locale } = await params;
  
  return <RecipesList locale={locale} />;
}

export const runtime = 'edge';