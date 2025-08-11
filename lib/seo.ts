// SEO 工具函数

// 网站基础 URL
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://recipe-easy.com';

// 生成 canonical URL
export function generateCanonicalUrl(path: string = '', locale?: string): string {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  
  if (locale === 'en' || !locale) {
    return cleanPath ? `${SITE_URL}/${cleanPath}` : SITE_URL;
  }
  
  return cleanPath ? `${SITE_URL}/${locale}/${cleanPath}` : `${SITE_URL}/${locale}`;
}

// 生成页面元数据
export function generateMetadata({
  title,
  description,
  path = '',
  locale,
  image = 'images/recipe-easy-og.png',
  type = 'website'
}: {
  title: string;
  description: string;
  path?: string;
  locale?: string;
  image?: string;
  type?: 'website' | 'article';
}) {
  const canonicalUrl = generateCanonicalUrl(path, locale);
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}/${image}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'RecipeEasy',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// 生成结构化数据
export function generateStructuredData(type: string, data: any) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };
}

// 网站结构化数据
export const websiteStructuredData = generateStructuredData('WebSite', {
  name: 'RecipeEasy',
  url: SITE_URL,
  description: 'AI-powered recipe generation platform',
  inLanguage: ['en', 'zh'],
});

// 食谱结构化数据
export function generateRecipeStructuredData(recipe: any) {
  return generateStructuredData('Recipe', {
    name: recipe.title,
    description: recipe.description,
    cookTime: `PT${recipe.cookingTime}M`,
    recipeYield: recipe.servings,
    recipeInstructions: recipe.instructions,
    recipeIngredient: recipe.ingredients,
  });
}

// 组织结构化数据
export const organizationStructuredData = generateStructuredData('Organization', {
  name: 'RecipeEasy',
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo.png`,
  description: 'AI-powered recipe generation platform',
  sameAs: [
    
  ],
}); 