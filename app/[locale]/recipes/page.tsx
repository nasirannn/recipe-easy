import { Metadata } from 'next';
import { RecipesList } from '@/components/recipe/recipes-list';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';

interface RecipesPageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({
  params,
}: RecipesPageProps): Promise<Metadata> {
  const { locale } = params;
  
  return generateSeoMetadata({
    title: 'All Recipes - RecipeEasy',
    description: 'Discover delicious recipes from around the world. Browse our collection of AI-generated recipes with step-by-step instructions.',
    path: 'recipes',
    locale,
  });
}

export default function RecipesPage({ params }: RecipesPageProps) {
  const { locale } = params;
  
  return <RecipesList locale={locale} />;
}

// 移除 Edge Runtime 以启用静态生成 