import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecipeDetail } from '@/components/recipe/recipe-detail';
import { FooterSection } from '@/components/layout/sections/footer';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';
import { env } from '@/lib/env';
import { getImageUrl } from '@/lib/config';
import { getPostgresPool } from '@/lib/server/postgres';
import { getRecipeById } from '@/lib/server/recipes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const nutrition = recipe?.nutrition && typeof recipe.nutrition === 'object'
    ? recipe.nutrition
    : {};

  const nutritionInformation = (() => {
    const calories = Number(nutrition?.calories);
    const protein = Number(nutrition?.protein);
    const carbohydrates = Number(nutrition?.carbohydrates);
    const fat = Number(nutrition?.fat);
    const fiber = Number(nutrition?.fiber);
    const sugar = Number(nutrition?.sugar);

    const hasNutrition = [calories, protein, carbohydrates, fat, fiber, sugar].some((value) =>
      Number.isFinite(value)
    );
    if (!hasNutrition) {
      return undefined;
    }

    return {
      '@type': 'NutritionInformation',
      calories: Number.isFinite(calories) ? `${calories} kcal` : undefined,
      proteinContent: Number.isFinite(protein) ? `${protein} g` : undefined,
      carbohydrateContent: Number.isFinite(carbohydrates) ? `${carbohydrates} g` : undefined,
      fatContent: Number.isFinite(fat) ? `${fat} g` : undefined,
      fiberContent: Number.isFinite(fiber) ? `${fiber} g` : undefined,
      sugarContent: Number.isFinite(sugar) ? `${sugar} g` : undefined,
    };
  })();

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
    nutrition: nutritionInformation,
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
    const db = getPostgresPool();
    const recipe = await getRecipeById(db, id, locale);

    if (!recipe) {
      return generateSeoMetadata({
        title: 'Recipe Not Found - RecipeEasy',
        description: 'The requested recipe could not be found.',
        path: `recipe/${id}`,
        locale,
      });
    }

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
    const db = getPostgresPool();
    return await getRecipeById(db, id, locale);
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
      <FooterSection />
    </>
  );
}
