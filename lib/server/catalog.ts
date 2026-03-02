import { PgClientLike } from '@/lib/server/postgres';

type SupportedLanguage = 'en' | 'zh';

export type CuisineView = {
  id: number;
  slug: string;
  name: string;
};

export type CategoryView = {
  id: number;
  slug: string;
  name: string;
};

export type IngredientView = {
  id: number;
  slug: string;
  name: string;
  category: {
    id: number;
    slug: string;
    name: string;
  };
};

export type IngredientListOptions = {
  lang?: string;
  category?: string | null;
  limit?: number;
  offset?: number;
};

function normalizeLanguage(value?: string): SupportedLanguage {
  if (!value) {
    return 'en';
  }
  return value.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(200, Math.max(1, Math.floor(value as number)));
}

function normalizeOffset(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value as number));
}

export async function listCuisines(
  db: PgClientLike,
  lang?: string
): Promise<{ language: SupportedLanguage; results: CuisineView[] }> {
  const language = normalizeLanguage(lang);
  const queryResult = await db.query<{
    id: number;
    slug: string;
    name: string;
  }>(
    `
      SELECT
        c.id::int AS id,
        c.slug,
        COALESCE(ci.name, c.name) AS name
      FROM cuisines c
      LEFT JOIN cuisines_i18n ci
        ON c.id = ci.cuisine_id AND ci.language_code = $1
      ORDER BY name ASC
    `,
    [language]
  );

  const results = queryResult.rows.map((row) => ({
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
  }));

  return { language, results };
}

export async function listCategories(
  db: PgClientLike,
  lang?: string
): Promise<{ language: SupportedLanguage; results: CategoryView[] }> {
  const language = normalizeLanguage(lang);
  const queryResult = await db.query<{
    id: number;
    slug: string;
    name: string;
  }>(
    `
      SELECT
        c.id::int AS id,
        c.slug,
        COALESCE(ci.name, c.name) AS name
      FROM ingredient_categories c
      LEFT JOIN ingredient_categories_i18n ci
        ON c.id = ci.category_id AND ci.language_code = $1
      ORDER BY name ASC
    `,
    [language]
  );

  const results = queryResult.rows.map((row) => ({
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
  }));

  return { language, results };
}

export async function listIngredients(
  db: PgClientLike,
  options: IngredientListOptions = {}
): Promise<{
  language: SupportedLanguage;
  results: IngredientView[];
  limit: number;
  offset: number;
}> {
  const language = normalizeLanguage(options.lang);
  const limit = normalizeLimit(options.limit, 100);
  const offset = normalizeOffset(options.offset);
  const categoryInput = (options.category ?? '').trim();

  const whereParts: string[] = [];
  const bindParams: Array<string | number> = [language, language];

  if (categoryInput) {
    const asNumber = Number.parseInt(categoryInput, 10);
    if (!Number.isNaN(asNumber)) {
      whereParts.push(`i.category_id = $${bindParams.length + 1}`);
      bindParams.push(asNumber);
    } else {
      whereParts.push(`c.slug = $${bindParams.length + 1}`);
      bindParams.push(categoryInput);
    }
  }

  const limitParam = bindParams.length + 1;
  const offsetParam = bindParams.length + 2;
  bindParams.push(limit, offset);
  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

  const queryResult = await db.query<{
    id: number;
    slug: string;
    category_id: number;
    ingredient_name: string;
    category_slug: string;
    category_name: string;
  }>(
    `
      SELECT
        i.id::int AS id,
        i.slug,
        i.category_id::int AS category_id,
        COALESCE(ii.name, i.name) AS ingredient_name,
        c.slug AS category_slug,
        COALESCE(ci.name, c.name) AS category_name
      FROM ingredients i
      LEFT JOIN ingredients_i18n ii
        ON i.id = ii.ingredient_id AND ii.language_code = $1
      LEFT JOIN ingredient_categories c
        ON i.category_id = c.id
      LEFT JOIN ingredient_categories_i18n ci
        ON c.id = ci.category_id AND ci.language_code = $2
      ${whereClause}
      ORDER BY ingredient_name ASC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `,
    bindParams
  );

  const results = queryResult.rows.map((row) => ({
    id: Number(row.id),
    slug: row.slug,
    name: row.ingredient_name,
    category: {
      id: Number(row.category_id),
      slug: row.category_slug,
      name: row.category_name,
    },
  }));

  return { language, results, limit, offset };
}
