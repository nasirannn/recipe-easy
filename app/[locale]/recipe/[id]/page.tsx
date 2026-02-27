import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecipeDetail } from '@/components/recipe/recipe-detail';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';
import { env } from '@/lib/env';
import { getImageUrl } from '@/lib/config';

interface RecipePageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return normalizeStringArray(parsed);
  } catch {
    return [];
  }
}

function buildRecipeStructuredData(recipe: any, locale: string, id: string) {
  const baseUrl = env.APP_URL.replace(/\/+$/, '');
  const isZh = locale.toLowerCase().startsWith('zh');
  const pageUrl = isZh ? `${baseUrl}/zh/recipe/${id}` : `${baseUrl}/recipe/${id}`;

  const ingredients = normalizeStringArray(recipe.ingredients);
  const instructions = normalizeStringArray(recipe.instructions);
  const tags = normalizeStringArray(recipe.tags);
  const rawImage = typeof recipe.imagePath === 'string' ? recipe.imagePath : '';
  const imageUrl = rawImage ? getImageUrl(rawImage) : '';
  const cookingMinutes = Number.isFinite(Number(recipe.cookingTime))
    ? Math.max(0, Number(recipe.cookingTime))
    : 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description || `How to make ${recipe.title}`,
    url: pageUrl,
    inLanguage: isZh ? 'zh-CN' : 'en',
    image: imageUrl ? [imageUrl] : undefined,
    recipeYield: recipe.servings ? String(recipe.servings) : undefined,
    totalTime: cookingMinutes > 0 ? `PT${cookingMinutes}M` : undefined,
    recipeIngredient: ingredients,
    recipeInstructions: instructions.map((text, index) => ({
      '@type': 'HowToStep',
      name: isZh ? `步骤 ${index + 1}` : `Step ${index + 1}`,
      text,
    })),
    keywords: tags.length > 0 ? tags.join(', ') : undefined,
    datePublished: recipe.createdAt || undefined,
    dateModified: recipe.updatedAt || recipe.createdAt || undefined,
  };
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { locale, id } = await params;
  
  try {
    // 获取菜谱数据用于SEO - 统一使用配置中的应用域名
    const apiUrl = `${env.APP_URL}/api/recipes/${id}?lang=${locale}`;
    const response = await fetch(apiUrl);
    const data = await response.json() as any;
    
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
    // Error generating metadata
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
    // 在服务器端统一使用配置中的应用域名
    const apiUrl = `${env.APP_URL}/api/recipes/${id}?lang=${locale}`;
    const response = await fetch(apiUrl, {
      // 添加缓存控制
      next: { revalidate: 3600 } // 1小时缓存
    });
    
    if (!response.ok) {
      // Failed to fetch recipe
      return null;
    }
    
    const data = await response.json() as any;
    
    if (!data.success) {
      // Recipe API returned error
      return null;
    }
    
    return data.recipe;
  } catch (error) {
    // Error fetching recipe
    return null;
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { locale, id } = await params;
  
  const recipe = await getRecipe(id, locale);
  
  if (!recipe) {
    notFound();
  }

  const recipeStructuredData = buildRecipeStructuredData(recipe, locale, id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeStructuredData) }}
      />
      <RecipeDetail recipe={recipe} locale={locale} />
    </>
  );
}
