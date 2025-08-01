// SEO 工具函数

// 网站基础 URL
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://recipe-easy.com'

// 生成 canonical URL
export function generateCanonicalUrl(path: string = '', locale?: string): string {
  // 移除开头的斜杠
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // 如果是默认语言 (en)，不添加语言前缀
  if (locale === 'en' || !locale) {
    return `${SITE_URL}/${cleanPath}`.replace(/\/+$/, '')
  }
  
  // 其他语言添加语言前缀
  return `${SITE_URL}/${locale}/${cleanPath}`.replace(/\/+$/, '')
}

// 生成页面元数据
export function generateMetadata({
  title,
  description,
  path = '',
  locale,
  image = '/recipe-easy-og.png',
  type = 'website'
}: {
  title: string
  description: string
  path?: string
  locale?: string
  image?: string
  type?: 'website' | 'article'
}) {
  const canonicalUrl = generateCanonicalUrl(path, locale)
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`

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
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

// 生成结构化数据
export function generateStructuredData({
  type,
  data
}: {
  type: 'website' | 'article' | 'recipe'
  data: any
}) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
  }

  return {
    ...baseData,
    ...data,
  }
}

// 网站结构化数据
export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'RecipeEasy',
  url: SITE_URL,
  description: 'AI Recipe Generator, Random Recipes, Meal Ideas',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

// 组织结构化数据
export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RecipeEasy',
  url: SITE_URL,
  logo: `${SITE_URL}/recipe-easy-logo.svg`,
  sameAs: [
    // 添加您的社交媒体链接
    // 'https://twitter.com/recipeeasy',
    // 'https://facebook.com/recipeeasy',
  ],
} 