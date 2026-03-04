import { MetadataRoute } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { SITE_URL } from '@/lib/seo';
import { getPostgresPool } from '@/lib/server/postgres';

type RecipeSitemapRow = {
  id: string;
  updated_at: Date | string | null;
};

function buildSitemapAlternates(baseUrl: string, path: string) {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const enUrl = cleanPath ? `${baseUrl}/${cleanPath}` : `${baseUrl}`;
  const zhUrl = cleanPath ? `${baseUrl}/zh/${cleanPath}` : `${baseUrl}/zh`;

  return {
    languages: {
      en: enUrl,
      zh: zhUrl,
    },
  };
}

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
      const recipePath = `recipe/${row.id}`;
      const alternates = buildSitemapAlternates(baseUrl, recipePath);

      return [
        {
          url: `${baseUrl}/recipe/${row.id}`,
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
          alternates,
        },
        {
          url: `${baseUrl}/zh/recipe/${row.id}`,
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
          alternates,
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
      alternates: buildSitemapAlternates(baseUrl, ''),
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
      alternates: buildSitemapAlternates(baseUrl, 'explore'),
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: buildSitemapAlternates(baseUrl, 'pricing'),
    },
    {
      url: `${baseUrl}/meal-plan`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: buildSitemapAlternates(baseUrl, 'meal-plan'),
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: privacyEnDate,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
      alternates: buildSitemapAlternates(baseUrl, 'privacy'),
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: termsEnDate,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
      alternates: buildSitemapAlternates(baseUrl, 'terms'),
    },
  ];

  const localizedRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/zh`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
      alternates: buildSitemapAlternates(baseUrl, ''),
    },
    {
      url: `${baseUrl}/zh/explore`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
      alternates: buildSitemapAlternates(baseUrl, 'explore'),
    },
    {
      url: `${baseUrl}/zh/pricing`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: buildSitemapAlternates(baseUrl, 'pricing'),
    },
    {
      url: `${baseUrl}/zh/meal-plan`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: buildSitemapAlternates(baseUrl, 'meal-plan'),
    },
    {
      url: `${baseUrl}/zh/privacy`,
      lastModified: privacyZhDate,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
      alternates: buildSitemapAlternates(baseUrl, 'privacy'),
    },
    {
      url: `${baseUrl}/zh/terms`,
      lastModified: termsZhDate,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
      alternates: buildSitemapAlternates(baseUrl, 'terms'),
    },
  ];

  return [...routes, ...localizedRoutes, ...recipeDetailRoutes];
}
