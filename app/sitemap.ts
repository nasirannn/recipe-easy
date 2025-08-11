
import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 确保使用HTTPS
  const baseUrl = SITE_URL.replace(/^http:/, 'https:')
  
  // 设置不同类型页面的更新时间
  const now = new Date()
  const staticPageDate = new Date('2024-12-01') // 静态页面的基准时间
  
  // 基础页面
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now, // 首页保持动态更新
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/recipes`,
      lastModified: now, // 菜谱列表页保持动态更新
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: staticPageDate, // 隐私政策使用固定时间
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: staticPageDate, // 服务条款使用固定时间
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ]

  // 多语言页面
  const locales = ['zh']
  const localizedRoutes: MetadataRoute.Sitemap = locales.flatMap(locale => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: now, // 本地化首页保持动态更新
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/${locale}/recipes`,
      lastModified: now, // 本地化菜谱页保持动态更新
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/${locale}/privacy`,
      lastModified: staticPageDate, // 本地化隐私政策使用固定时间
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/${locale}/terms`,
      lastModified: staticPageDate, // 本地化服务条款使用固定时间
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ])
  return [...routes, ...localizedRoutes]
} 
