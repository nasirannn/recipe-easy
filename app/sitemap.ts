import { MetadataRoute } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { SITE_URL } from '@/lib/seo';
import { getPostgresPool } from '@/lib/server/postgres';

type RecipeSitemapRow = {
  id: string;
  updated_at: Date | string | null;
};

async function getLegalFileLastModified(fileName: string, fallback: Date): Promise<Date> {
  try {
    const absolutePath = path.join(process.cwd(), 'docs', 'legal', fileName);
    const fileStat = await fs.stat(absolutePath);
    return fileStat.mtime;
  } catch {
    return fallback;
  }
}

async function getRecipeDetailRoutes(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const db = getPostgresPool();
    const { rows } = await db.query<RecipeSitemapRow>(
      `
        SELECT id, updated_at
        FROM recipes
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 5000
      `
    );

    return rows.flatMap((row) => {
      const lastModified = row.updated_at ? new Date(row.updated_at) : new Date();

      return [
        {
          url: `${baseUrl}/recipe/${row.id}`,
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        },
        {
          url: `${baseUrl}/zh/recipe/${row.id}`,
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        },
      ];
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[sitemap] Failed to load recipe detail URLs: ${message}`);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL.replace(/^http:/, 'https:');
  const now = new Date();
  const fallbackStaticDate = new Date('2024-12-01');

  const [privacyEnDate, termsEnDate, privacyZhDate, termsZhDate, recipeDetailRoutes] = await Promise.all([
    getLegalFileLastModified('privacy-policy.md', fallbackStaticDate),
    getLegalFileLastModified('terms-of-service.md', fallbackStaticDate),
    getLegalFileLastModified('privacy-policy-zh.md', fallbackStaticDate),
    getLegalFileLastModified('terms-of-service-zh.md', fallbackStaticDate),
    getRecipeDetailRoutes(baseUrl),
  ]);

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: privacyEnDate,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: termsEnDate,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];

  const localizedRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/zh`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/zh/explore`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/zh/pricing`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/zh/privacy`,
      lastModified: privacyZhDate,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/zh/terms`,
      lastModified: termsZhDate,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];

  return [...routes, ...localizedRoutes, ...recipeDetailRoutes];
}
