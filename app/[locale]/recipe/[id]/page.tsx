import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecipeDetail } from '@/components/recipe/recipe-detail';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';
import { env } from '@/lib/env';

interface RecipePageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { locale, id } = await params;
  
  try {
    // 获取菜谱数据用于SEO - 在服务器端使用完整URL
    const apiUrl = env.IS_DEVELOPMENT ? `http://localhost:3000/api/recipes/${id}?lang=${locale}` : `${env.APP_URL}/api/recipes/${id}?lang=${locale}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.success || !data.recipe) {
      return generateSeoMetadata({
        title: 'Recipe Not Found - RecipeEasy',
        description: 'The requested recipe could not be found.',
        path: `recipe/${id}`,
        locale,
      });
    }

    const recipe = data.recipe;
    return generateSeoMetadata({
      title: `${recipe.title} - RecipeEasy`,
      description: recipe.description || `Learn how to make ${recipe.title} with our step-by-step recipe guide.`,
      path: `recipe/${id}`,
      locale,
      type: 'article'
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return generateSeoMetadata({
      title: 'Recipe - RecipeEasy',
      description: 'Discover delicious recipes on RecipeEasy.',
      path: `recipe/${id}`,
      locale,
    });
  }
}

async function getRecipe(id: string, locale: string) {
  try {
    // 在服务器端使用完整URL
    const apiUrl = env.IS_DEVELOPMENT ? `http://localhost:3000/api/recipes/${id}?lang=${locale}` : `${env.APP_URL}/api/recipes/${id}?lang=${locale}`;
    const response = await fetch(apiUrl, {
      // 添加缓存控制
      next: { revalidate: 3600 } // 1小时缓存
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch recipe: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Recipe API returned error:', data.error);
      return null;
    }
    
    return data.recipe;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { locale, id } = await params;
  
  const recipe = await getRecipe(id, locale);
  
  if (!recipe) {
    notFound();
  }
  
  return <RecipeDetail recipe={recipe} locale={locale} />;
}

// 移除 Edge Runtime 以启用静态生成 