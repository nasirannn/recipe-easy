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
  const isZh = locale.toLowerCase().startsWith('zh');

  return generateSeoMetadata({
    title: isZh ? '全部菜谱 - RecipeEasy' : 'All Recipes - RecipeEasy',
    description: isZh
      ? '浏览来自不同风味的 AI 菜谱合集，查看清晰步骤并快速找到今天就能做的菜。'
      : 'Discover delicious recipes from around the world. Browse our collection of AI-generated recipes with step-by-step instructions.',
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
