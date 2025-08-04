import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecipeDetail } from '@/components/recipe/recipe-detail';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';
import { getApiUrl } from '@/lib/env';

interface RecipePageProps {
  params: {
    locale: string;
    id: string;
  };
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { locale, id } = params;
  
  try {
    // 获取菜谱数据用于SEO - 使用环境配置
    const response = await fetch(getApiUrl(`/api/recipes/${id}?lang=${locale}`));
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
      description: recipe.description || `Delicious ${recipe.title} recipe with step-by-step instructions.`,
      path: `recipe/${id}`,
      locale,
      image: recipe.image_url,
      type: 'article',
    });
  } catch (error) {
    return generateSeoMetadata({
      title: 'Recipe - RecipeEasy',
      description: 'Delicious recipe with step-by-step instructions.',
      path: `recipe/${id}`,
      locale,
    });
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { locale, id } = params;
  
  try {
    // 使用环境配置获取 API URL
    const response = await fetch(getApiUrl(`/api/recipes/${id}?lang=${locale}`), {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RecipeEasy-Server/1.0'
      }
    });
    
    if (!response.ok) {
      notFound();
    }
    
    const data = await response.json();
    
    if (!data.success || !data.recipe) {
      notFound();
    }
    
    return <RecipeDetail recipe={data.recipe} locale={locale} />;
  } catch (error) {
    notFound();
  }
}

export const runtime = 'edge'; 