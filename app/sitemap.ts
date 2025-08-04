import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 确保使用HTTPS
  const baseUrl = SITE_URL.replace(/^http:/, 'https:')
  
  // 基础页面
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/recipes`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ]

  // 多语言页面
  const locales = ['zh']
  const localizedRoutes: MetadataRoute.Sitemap = locales.flatMap(locale => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/${locale}/recipes`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/${locale}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/${locale}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ])

  // 动态菜谱页面 - 从API获取菜谱列表
  try {
    const response = await fetch('https://recipe-easy.com/api/recipes?lang=en&limit=100')
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.results) {
        const recipeRoutes: MetadataRoute.Sitemap = data.results.map((recipe: any) => ({
          url: `${baseUrl}/recipe/${recipe.id}`,
          lastModified: new Date(recipe.updated_at || recipe.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
        
        // 中文菜谱页面
        const zhRecipeRoutes: MetadataRoute.Sitemap = data.results.map((recipe: any) => ({
          url: `${baseUrl}/zh/recipe/${recipe.id}`,
          lastModified: new Date(recipe.updated_at || recipe.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
        
        return [...routes, ...localizedRoutes, ...recipeRoutes, ...zhRecipeRoutes]
      }
    }
  } catch (error) {
    console.error('Error fetching recipes for sitemap:', error)
  }

  return [...routes, ...localizedRoutes]
} 