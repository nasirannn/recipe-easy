import { PgClientLike, withPgTransaction } from '@/lib/server/postgres';
import { buildR2PublicUrl, extractR2ObjectKey } from '@/lib/server/r2';

export type SupportedRecipeLanguage = 'en' | 'zh';

export type RecipeListOptions = {
  page?: number;
  limit?: number;
  lang?: string;
  search?: string;
  userId?: string;
  withImage?: boolean;
};

export type RecipeMutationInput = {
  title?: string;
  description?: string;
  cookingTime?: number;
  cooking_time?: number;
  servings?: number;
  difficulty?: string;
  ingredients?: unknown;
  seasoning?: unknown;
  instructions?: unknown;
  tags?: unknown;
  chefTips?: unknown;
  chef_tips?: unknown;
  cuisineId?: number;
  cuisine_id?: number;
  imagePath?: string;
  imageModel?: string;
};

type RecipeRow = {
  id: string;
  title: string | null;
  description: string | null;
  cooking_time: number | null;
  servings: number | null;
  difficulty: string | null;
  ingredients: string | null;
  seasoning: string | null;
  instructions: string | null;
  tags: string | null;
  chef_tips: string | null;
  user_id: string | null;
  cuisine_id: number | null;
  created_at: unknown;
  updated_at: unknown;
  image_path: string | null;
  image_model: string | null;
  localized_title: string | null;
  localized_description: string | null;
  localized_ingredients: string | null;
  localized_seasoning: string | null;
  localized_instructions: string | null;
  localized_tags: string | null;
  localized_difficulty: string | null;
  localized_chef_tips: string | null;
  cuisine_name: string | null;
  cuisine_slug: string | null;
};

type MutableRecipeRow = {
  id: string;
  title: string;
  description: string | null;
  cooking_time: number | null;
  servings: number | null;
  difficulty: string | null;
  ingredients: string | null;
  seasoning: string | null;
  instructions: string | null;
  tags: string | null;
  chef_tips: string | null;
  cuisine_id: number | null;
};

export type RecipeView = {
  id: string;
  title: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: string;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  tags: string[];
  chefTips: string[];
  imagePath?: string;
  imageModel?: string;
  userId?: string;
  cuisineId?: number;
  createdAt?: string;
  updatedAt?: string;
  cuisine?: {
    id: number;
    name: string;
    slug?: string;
  };
};

function normalizeImagePathForStorage(imagePath: string): string {
  const trimmed = imagePath.trim();
  if (!trimmed) {
    return '';
  }

  const r2Key = extractR2ObjectKey(trimmed);
  if (!r2Key) {
    return trimmed;
  }

  const publicUrl = buildR2PublicUrl(r2Key);
  if (/^https?:\/\//i.test(publicUrl)) {
    return publicUrl;
  }

  const appBase = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').replace(/\/+$/, '');
  if (appBase) {
    return `${appBase}/api/images/${r2Key}`;
  }

  return trimmed;
}

function normalizeLanguage(input?: string): SupportedRecipeLanguage {
  if (!input) {
    return 'en';
  }
  return input.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function normalizePage(input: number | undefined): number {
  if (!Number.isFinite(input)) {
    return 1;
  }
  return Math.max(1, Math.floor(input as number));
}

function normalizeLimit(input: number | undefined, fallback: number): number {
  if (!Number.isFinite(input)) {
    return fallback;
  }
  return Math.min(100, Math.max(1, Math.floor(input as number)));
}

function toIso(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object' && 'name' in (item as Record<string, unknown>)) {
          const name = (item as Record<string, unknown>).name;
          return typeof name === 'string' ? name : '';
        }
        return typeof item === 'number' ? String(item) : '';
      })
      .filter(Boolean);
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return parseJsonArray(parsed);
  } catch {
    return [];
  }
}

function stringifyJsonArray(value: unknown): string {
  return JSON.stringify(parseJsonArray(value));
}

function toRecipeView(row: RecipeRow): RecipeView {
  const title = row.localized_title ?? row.title ?? '';
  const description = row.localized_description ?? row.description ?? '';
  const difficulty = row.localized_difficulty ?? row.difficulty ?? '';

  const ingredients = parseJsonArray(row.localized_ingredients ?? row.ingredients);
  const seasoning = parseJsonArray(row.localized_seasoning ?? row.seasoning);
  const instructions = parseJsonArray(row.localized_instructions ?? row.instructions);
  const tags = parseJsonArray(row.localized_tags ?? row.tags);
  const chefTips = parseJsonArray(row.localized_chef_tips ?? row.chef_tips);

  const cuisineId = row.cuisine_id === null ? undefined : toNumber(row.cuisine_id);

  return {
    id: row.id,
    title,
    description,
    cookingTime: toNumber(row.cooking_time, 0),
    servings: toNumber(row.servings, 0),
    difficulty,
    ingredients,
    seasoning,
    instructions,
    tags,
    chefTips,
    imagePath: row.image_path ?? undefined,
    imageModel: row.image_model ?? undefined,
    userId: row.user_id ?? undefined,
    cuisineId,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    cuisine:
      row.cuisine_name && cuisineId
        ? {
            id: cuisineId,
            name: row.cuisine_name,
            slug: row.cuisine_slug ?? undefined,
          }
        : undefined,
  };
}

function buildWhereClause(options: {
  search: string;
  userId?: string;
  withImage?: boolean;
  startIndex: number;
}): { clause: string; params: string[]; nextIndex: number } {
  const where: string[] = [];
  const params: string[] = [];
  let idx = options.startIndex;

  if (options.userId) {
    where.push(`r.user_id = $${idx}`);
    params.push(options.userId);
    idx += 1;
  }

  if (options.search) {
    where.push(
      `(COALESCE(ri.title, r.title) ILIKE $${idx} OR COALESCE(ri.description, r.description) ILIKE $${idx + 1})`
    );
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern);
    idx += 2;
  }

  if (options.withImage) {
    where.push(
      "EXISTS (SELECT 1 FROM recipe_images rimg WHERE rimg.recipe_id = r.id AND rimg.image_path IS NOT NULL AND BTRIM(rimg.image_path) <> '')"
    );
  }

  return {
    clause: where.length > 0 ? `WHERE ${where.join(' AND ')}` : '',
    params,
    nextIndex: idx,
  };
}

const RECIPE_SELECT_SQL = `
  SELECT
    r.id,
    r.title,
    r.description,
    r.cooking_time,
    r.servings,
    r.difficulty,
    r.ingredients,
    r.seasoning,
    r.instructions,
    r.tags,
    r.chef_tips,
    r.user_id,
    r.cuisine_id::int AS cuisine_id,
    r.created_at,
    r.updated_at,
    rim.image_path,
    rim.image_model,
    COALESCE(ri.title, r.title) AS localized_title,
    COALESCE(ri.description, r.description) AS localized_description,
    COALESCE(ri.ingredients, r.ingredients) AS localized_ingredients,
    COALESCE(ri.seasoning, r.seasoning) AS localized_seasoning,
    COALESCE(ri.instructions, r.instructions) AS localized_instructions,
    COALESCE(ri.tags, r.tags) AS localized_tags,
    COALESCE(ri.difficulty, r.difficulty) AS localized_difficulty,
    COALESCE(ri.chef_tips, r.chef_tips) AS localized_chef_tips,
    COALESCE(ci.name, c.name) AS cuisine_name,
    c.slug AS cuisine_slug
  FROM recipes r
  LEFT JOIN recipes_i18n ri
    ON r.id = ri.recipe_id AND ri.language_code = $1
  LEFT JOIN LATERAL (
    SELECT image_path, image_model
    FROM recipe_images rimg
    WHERE rimg.recipe_id = r.id
    ORDER BY rimg.created_at DESC
    LIMIT 1
  ) rim ON TRUE
  LEFT JOIN cuisines c
    ON r.cuisine_id = c.id
  LEFT JOIN cuisines_i18n ci
    ON c.id = ci.cuisine_id AND ci.language_code = $2
`;

export async function listRecipes(
  db: PgClientLike,
  options: RecipeListOptions = {}
): Promise<{
  results: RecipeView[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  language: SupportedRecipeLanguage;
}> {
  const language = normalizeLanguage(options.lang);
  const page = normalizePage(options.page);
  const limit = normalizeLimit(options.limit, 12);
  const offset = (page - 1) * limit;
  const search = (options.search ?? '').trim();

  const selectWhere = buildWhereClause({
    search,
    userId: options.userId,
    withImage: options.withImage,
    startIndex: 3,
  });

  const dataParams: Array<string | number> = [language, language, ...selectWhere.params];
  dataParams.push(limit, offset);
  const limitParam = dataParams.length - 1;
  const offsetParam = dataParams.length;

  const dataResult = await db.query<RecipeRow>(
    `
      ${RECIPE_SELECT_SQL}
      ${selectWhere.clause}
      ORDER BY r.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `,
    dataParams
  );

  const countWhere = buildWhereClause({
    search,
    userId: options.userId,
    withImage: options.withImage,
    startIndex: 2,
  });
  const countResult = await db.query<{ count: string }>(
    `
      SELECT COUNT(*) AS count
      FROM recipes r
      LEFT JOIN recipes_i18n ri
        ON r.id = ri.recipe_id AND ri.language_code = $1
      ${countWhere.clause}
    `,
    [language, ...countWhere.params]
  );

  const total = toNumber(countResult.rows[0]?.count, 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    results: dataResult.rows.map(toRecipeView),
    page,
    limit,
    total,
    totalPages,
    language,
  };
}

export async function getRecipeById(
  db: PgClientLike,
  recipeId: string,
  lang?: string
): Promise<RecipeView | null> {
  const language = normalizeLanguage(lang);
  const result = await db.query<RecipeRow>(
    `
      ${RECIPE_SELECT_SQL}
      WHERE r.id = $3
      LIMIT 1
    `,
    [language, language, recipeId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return toRecipeView(result.rows[0]);
}

export async function updateRecipeById(
  db: PgClientLike,
  recipeId: string,
  userId: string,
  input: RecipeMutationInput
): Promise<boolean> {
  const existingResult = await db.query<MutableRecipeRow>(
    `
      SELECT id, title, description, cooking_time, servings, difficulty,
             ingredients, seasoning, instructions, tags, chef_tips, cuisine_id::int AS cuisine_id
      FROM recipes
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [recipeId, userId]
  );
  const existing = existingResult.rows[0];

  if (!existing) {
    return false;
  }

  const payload = {
    title: input.title ?? existing.title,
    description: input.description ?? existing.description ?? '',
    cooking_time: input.cookingTime ?? input.cooking_time ?? existing.cooking_time ?? 30,
    servings: input.servings ?? existing.servings ?? 1,
    difficulty: input.difficulty ?? existing.difficulty ?? 'medium',
    ingredients:
      input.ingredients !== undefined ? stringifyJsonArray(input.ingredients) : existing.ingredients ?? '[]',
    seasoning:
      input.seasoning !== undefined ? stringifyJsonArray(input.seasoning) : existing.seasoning ?? '[]',
    instructions:
      input.instructions !== undefined
        ? stringifyJsonArray(input.instructions)
        : existing.instructions ?? '[]',
    tags: input.tags !== undefined ? stringifyJsonArray(input.tags) : existing.tags ?? '[]',
    chef_tips:
      input.chefTips !== undefined || input.chef_tips !== undefined
        ? stringifyJsonArray(input.chefTips ?? input.chef_tips)
        : existing.chef_tips ?? '[]',
    cuisine_id: input.cuisineId ?? input.cuisine_id ?? existing.cuisine_id ?? null,
  };

  const updateResult = await db.query<{ id: string }>(
    `
      UPDATE recipes
      SET
        title = $1,
        description = $2,
        cooking_time = $3,
        servings = $4,
        difficulty = $5,
        ingredients = $6,
        seasoning = $7,
        instructions = $8,
        tags = $9,
        chef_tips = $10,
        cuisine_id = $11,
        updated_at = NOW()
      WHERE id = $12 AND user_id = $13
      RETURNING id
    `,
    [
      payload.title,
      payload.description,
      payload.cooking_time,
      payload.servings,
      payload.difficulty,
      payload.ingredients,
      payload.seasoning,
      payload.instructions,
      payload.tags,
      payload.chef_tips,
      payload.cuisine_id,
      recipeId,
      userId,
    ]
  );

  if (updateResult.rowCount !== 1) {
    return false;
  }

  if (input.imagePath) {
    const normalizedImagePath = normalizeImagePathForStorage(input.imagePath);
    const existingImageResult = await db.query<{ id: string }>(
      `
        SELECT id
        FROM recipe_images
        WHERE recipe_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [recipeId]
    );

    const existingImageId = existingImageResult.rows[0]?.id;

    if (existingImageId) {
      await db.query(
        `
          UPDATE recipe_images
          SET image_path = $1, image_model = $2, created_at = NOW()
          WHERE id = $3
        `,
        [normalizedImagePath, input.imageModel ?? 'unknown', existingImageId]
      );
    } else {
      await db.query(
        `
          INSERT INTO recipe_images (id, user_id, recipe_id, image_path, image_model, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [crypto.randomUUID(), userId, recipeId, normalizedImagePath, input.imageModel ?? 'unknown']
      );
    }
  }

  return true;
}

export async function deleteRecipeById(
  db: PgClientLike,
  recipeId: string,
  userId: string
): Promise<{ deleted: boolean; imagePaths: string[] }> {
  const imageRows = await db.query<{ image_path: string | null }>(
    'SELECT image_path FROM recipe_images WHERE recipe_id = $1',
    [recipeId]
  );

  const imagePaths = imageRows.rows
    .map((row) => row.image_path)
    .filter((path): path is string => typeof path === 'string' && path.length > 0);

  const deleted = await withPgTransaction(async (client) => {
    await client.query('DELETE FROM recipes_i18n WHERE recipe_id = $1', [recipeId]);
    await client.query('DELETE FROM recipe_images WHERE recipe_id = $1', [recipeId]);
    const recipeDelete = await client.query<{ id: string }>(
      'DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING id',
      [recipeId, userId]
    );
    return recipeDelete.rowCount === 1;
  });

  return { deleted, imagePaths };
}
