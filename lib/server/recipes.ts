import { PgClientLike, withPgTransaction } from '@/lib/server/postgres';
import { buildR2PublicUrl, extractR2ObjectKey } from '@/lib/server/r2';
import { normalizePairingType } from '@/lib/pairing';
import { normalizeRecipeVibe, type RecipeVibe } from '@/lib/vibe';
import {
  normalizeMealType,
  type MealType,
} from '@/lib/meal-type';

export type SupportedRecipeLanguage = 'en' | 'zh';

export type RecipeListOptions = {
  page?: number;
  limit?: number;
  lang?: string;
  search?: string;
  userId?: string;
  favoriteUserId?: string;
  withImage?: boolean;
};

export type RecipeMutationInput = {
  title?: string;
  description?: string;
  cookingTime?: number;
  cooking_time?: number;
  servings?: number;
  vibe?: string;
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
  authorName?: string;
  author_name?: string;
  pairing?: {
    type?: string | null;
    name?: string | null;
    note?: string | null;
    description?: string | null;
  };
  pairingType?: string | null;
  pairingName?: string | null;
  pairingNote?: string | null;
  pairingDescription?: string | null;
  pairing_type?: string | null;
  pairing_name?: string | null;
  pairing_note?: string | null;
  pairing_description?: string | null;
  nutrition?: {
    calories?: number | null;
    protein?: number | null;
    carbohydrates?: number | null;
    fat?: number | null;
    fiber?: number | null;
    sugar?: number | null;
  };
  calories?: number | null;
  protein?: number | null;
  carbohydrates?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  calories_kcal?: number | null;
  protein_g?: number | null;
  carbohydrates_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  mealType?: MealType | string | null;
  meal_type?: MealType | string | null;
};

type RecipeRow = {
  id: string;
  title: string | null;
  description: string | null;
  cooking_time: number | null;
  servings: number | null;
  vibe: string | null;
  ingredients: string | null;
  seasoning: string | null;
  instructions: string | null;
  tags: string | null;
  chef_tips: string | null;
  user_id: string | null;
  author_name: string | null;
  pairing_type: string | null;
  pairing_name: string | null;
  pairing_note: string | null;
  pairing_description: string | null;
  meal_type: string | null;
  cuisine_id: number | null;
  created_at: unknown;
  updated_at: unknown;
  image_path: string | null;
  image_model: string | null;
  language_code: string | null;
  cuisine_name: string | null;
  cuisine_slug: string | null;
  calories_kcal: unknown;
  protein_g: unknown;
  carbohydrates_g: unknown;
  fat_g: unknown;
  fiber_g: unknown;
  sugar_g: unknown;
};

type MutableRecipeRow = {
  id: string;
  title: string;
  description: string | null;
  cooking_time: number | null;
  servings: number | null;
  vibe: string | null;
  ingredients: string | null;
  seasoning: string | null;
  instructions: string | null;
  tags: string | null;
  chef_tips: string | null;
  author_name: string | null;
  pairing_type: string | null;
  pairing_name: string | null;
  pairing_note: string | null;
  pairing_description: string | null;
  meal_type: string | null;
  cuisine_id: number | null;
  calories_kcal: unknown;
  protein_g: unknown;
  carbohydrates_g: unknown;
  fat_g: unknown;
  fiber_g: unknown;
  sugar_g: unknown;
};

export type RecipeView = {
  id: string;
  title: string;
  description: string;
  cookingTime: number;
  servings: number;
  vibe: RecipeVibe;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  tags: string[];
  chefTips: string[];
  imagePath?: string;
  imageModel?: string;
  userId?: string;
  authorName?: string;
  pairing?: {
    type: string | null;
    name: string | null;
    note: string | null;
    description: string | null;
  };
  mealType?: MealType | null;
  cuisineId?: number;
  createdAt?: string;
  updatedAt?: string;
  cuisine?: {
    id: number;
    name: string;
    slug?: string;
  };
  nutrition: {
    calories: number | null;
    protein: number | null;
    carbohydrates: number | null;
    fat: number | null;
    fiber: number | null;
    sugar: number | null;
  };
};

let ensureRecipeNutritionSchemaPromise: Promise<void> | null = null;
let ensureRecipeFavoritesSchemaPromise: Promise<void> | null = null;

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

function getSiblingRecipeIdByLanguage(
  recipeId: string,
  language: SupportedRecipeLanguage
): string | null {
  const normalizedId = recipeId.trim();
  if (!normalizedId) {
    return null;
  }

  if (language === 'zh') {
    return normalizedId.endsWith('-zh') ? null : `${normalizedId}-zh`;
  }

  if (normalizedId.endsWith('-zh')) {
    const siblingId = normalizedId.slice(0, -3).trim();
    return siblingId || null;
  }

  return null;
}

export async function ensureRecipeNutritionSchema(db: PgClientLike): Promise<void> {
  if (!ensureRecipeNutritionSchemaPromise) {
    ensureRecipeNutritionSchemaPromise = (async () => {
      await db.query(`
        ALTER TABLE recipes
        ADD COLUMN IF NOT EXISTS author_name TEXT,
        ADD COLUMN IF NOT EXISTS vibe TEXT,
        ADD COLUMN IF NOT EXISTS pairing_type TEXT,
        ADD COLUMN IF NOT EXISTS pairing_name TEXT,
        ADD COLUMN IF NOT EXISTS pairing_note TEXT,
        ADD COLUMN IF NOT EXISTS pairing_description TEXT,
        ADD COLUMN IF NOT EXISTS calories_kcal NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS protein_g NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS carbohydrates_g NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS fat_g NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS fiber_g NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS sugar_g NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS meal_type TEXT,
        ADD COLUMN IF NOT EXISTS language_code TEXT
      `);

      await db.query(`
        DO $$
        DECLARE
          has_requested BOOLEAN;
          has_inferred BOOLEAN;
        BEGIN
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'recipes'
              AND column_name = 'requested_meal_type'
          ) INTO has_requested;

          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'recipes'
              AND column_name = 'inferred_meal_type'
          ) INTO has_inferred;

          IF has_requested AND has_inferred THEN
            EXECUTE $sql$
              UPDATE recipes
              SET meal_type = COALESCE(
                NULLIF(BTRIM(meal_type), ''),
                NULLIF(BTRIM(requested_meal_type), ''),
                NULLIF(BTRIM(inferred_meal_type), '')
              )
              WHERE meal_type IS NULL OR BTRIM(meal_type) = ''
            $sql$;
          ELSIF has_requested THEN
            EXECUTE $sql$
              UPDATE recipes
              SET meal_type = COALESCE(
                NULLIF(BTRIM(meal_type), ''),
                NULLIF(BTRIM(requested_meal_type), '')
              )
              WHERE meal_type IS NULL OR BTRIM(meal_type) = ''
            $sql$;
          ELSIF has_inferred THEN
            EXECUTE $sql$
              UPDATE recipes
              SET meal_type = COALESCE(
                NULLIF(BTRIM(meal_type), ''),
                NULLIF(BTRIM(inferred_meal_type), '')
              )
              WHERE meal_type IS NULL OR BTRIM(meal_type) = ''
            $sql$;
          END IF;
        END
        $$;
      `);

      await db.query(`
        UPDATE recipes
        SET vibe = CASE
          WHEN LOWER(BTRIM(vibe)) IN ('quick', 'easy', '简单', 'fast') THEN 'quick'
          WHEN LOWER(BTRIM(vibe)) IN ('gourmet', 'hard', '困难', 'complex') THEN 'gourmet'
          WHEN LOWER(BTRIM(vibe)) IN ('healthy', '健康', 'light') THEN 'healthy'
          WHEN LOWER(BTRIM(vibe)) IN ('comfort', 'medium', '中等') THEN 'comfort'
          ELSE 'comfort'
        END
        WHERE vibe IS NULL OR BTRIM(vibe) = ''
           OR LOWER(BTRIM(vibe)) NOT IN ('quick', 'comfort', 'gourmet', 'healthy')
      `);

      await db.query(`
        UPDATE recipes
        SET language_code = CASE
          WHEN language_code ILIKE 'zh%' THEN 'zh'
          ELSE 'en'
        END
        WHERE language_code IS NOT NULL
      `);

      await db.query(`
        UPDATE recipes
        SET language_code = 'en'
        WHERE language_code IS NULL OR BTRIM(language_code) = ''
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_recipes_language_code_created_at
        ON recipes (language_code, created_at DESC)
      `);

      await db.query(`
        ALTER TABLE recipes
        ALTER COLUMN language_code SET DEFAULT 'en'
      `);

      await db.query(`
        ALTER TABLE recipes
        ALTER COLUMN vibe SET DEFAULT 'comfort'
      `);

      await db.query(`
        ALTER TABLE recipes
        ALTER COLUMN language_code SET NOT NULL
      `);

      await db.query(`
        ALTER TABLE recipes
        ALTER COLUMN vibe SET NOT NULL
      `);

      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'recipes_language_code_check'
              AND conrelid = 'recipes'::regclass
          ) THEN
            ALTER TABLE recipes
            ADD CONSTRAINT recipes_language_code_check
            CHECK (language_code IN ('en', 'zh'));
          END IF;
        END
        $$;
      `);

      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'recipes_vibe_check'
              AND conrelid = 'recipes'::regclass
          ) THEN
            ALTER TABLE recipes
            ADD CONSTRAINT recipes_vibe_check
            CHECK (vibe IN ('quick', 'comfort', 'gourmet', 'healthy'));
          END IF;
        END
        $$;
      `);
    })().catch((error) => {
      ensureRecipeNutritionSchemaPromise = null;
      throw error;
    });
  }

  await ensureRecipeNutritionSchemaPromise;
}

export async function ensureRecipeFavoritesSchema(db: PgClientLike): Promise<void> {
  if (!ensureRecipeFavoritesSchemaPromise) {
    ensureRecipeFavoritesSchemaPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS recipe_favorites (
          user_id TEXT NOT NULL,
          recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, recipe_id)
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user_id_created_at
        ON recipe_favorites (user_id, created_at DESC)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe_id
        ON recipe_favorites (recipe_id)
      `);
    })().catch((error) => {
      ensureRecipeFavoritesSchemaPromise = null;
      throw error;
    });
  }

  await ensureRecipeFavoritesSchemaPromise;
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

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    return Math.round(value * 10) / 10;
  }

  const parsed = Number.parseFloat(String(value));
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.round(parsed * 10) / 10;
}

function pickNullableNumber(...candidates: unknown[]): number | null {
  for (const value of candidates) {
    const parsed = toNullableNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function normalizeAuthorName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 80);
}

function normalizePairingText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function normalizePairingInput(input: RecipeMutationInput | MutableRecipeRow): {
  type: string | null;
  name: string | null;
  note: string | null;
  description: string | null;
} {
  const pairingRecord =
    'pairing' in input && input.pairing && typeof input.pairing === 'object'
      ? (input.pairing as Record<string, unknown>)
      : null;

  return {
    type: normalizePairingType(
      pairingRecord?.type ??
        ('pairingType' in input ? input.pairingType : undefined) ??
        ('pairing_type' in input ? input.pairing_type : undefined)
    ),
    name: normalizePairingText(
      pairingRecord?.name ??
        ('pairingName' in input ? input.pairingName : undefined) ??
        ('pairing_name' in input ? input.pairing_name : undefined),
      80
    ),
    note: normalizePairingText(
      pairingRecord?.note ??
        ('pairingNote' in input ? input.pairingNote : undefined) ??
        ('pairing_note' in input ? input.pairing_note : undefined),
      120
    ),
    description: normalizePairingText(
      pairingRecord?.description ??
        ('pairingDescription' in input ? input.pairingDescription : undefined) ??
        ('pairing_description' in input ? input.pairing_description : undefined),
      320
    ),
  };
}

function normalizeMealTypeInput(input: RecipeMutationInput | MutableRecipeRow): MealType | null {
  return normalizeMealType(
    ('mealType' in input ? input.mealType : undefined) ??
      ('meal_type' in input ? input.meal_type : undefined),
    null
  );
}

function normalizeNutritionInput(input: RecipeMutationInput | MutableRecipeRow): {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
} {
  const nutritionRecord =
    'nutrition' in input && input.nutrition && typeof input.nutrition === 'object'
      ? (input.nutrition as Record<string, unknown>)
      : null;

  return {
    calories: pickNullableNumber(
      nutritionRecord?.calories,
      'calories' in input ? input.calories : undefined,
      'calories_kcal' in input ? input.calories_kcal : undefined
    ),
    protein: pickNullableNumber(
      nutritionRecord?.protein,
      'protein' in input ? input.protein : undefined,
      'protein_g' in input ? input.protein_g : undefined
    ),
    carbohydrates: pickNullableNumber(
      nutritionRecord?.carbohydrates,
      'carbohydrates' in input ? input.carbohydrates : undefined,
      'carbohydrates_g' in input ? input.carbohydrates_g : undefined
    ),
    fat: pickNullableNumber(
      nutritionRecord?.fat,
      'fat' in input ? input.fat : undefined,
      'fat_g' in input ? input.fat_g : undefined
    ),
    fiber: pickNullableNumber(
      nutritionRecord?.fiber,
      'fiber' in input ? input.fiber : undefined,
      'fiber_g' in input ? input.fiber_g : undefined
    ),
    sugar: pickNullableNumber(
      nutritionRecord?.sugar,
      'sugar' in input ? input.sugar : undefined,
      'sugar_g' in input ? input.sugar_g : undefined
    ),
  };
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
  const title = row.title ?? '';
  const description = row.description ?? '';
  const vibe = normalizeRecipeVibe(row.vibe, 'comfort');

  const ingredients = parseJsonArray(row.ingredients);
  const seasoning = parseJsonArray(row.seasoning);
  const instructions = parseJsonArray(row.instructions);
  const tags = parseJsonArray(row.tags);
  const chefTips = parseJsonArray(row.chef_tips);

  const cuisineId = row.cuisine_id === null ? undefined : toNumber(row.cuisine_id);
  const pairing = {
    type: normalizePairingType(row.pairing_type),
    name: normalizePairingText(row.pairing_name, 80),
    note: normalizePairingText(row.pairing_note, 120),
    description: normalizePairingText(row.pairing_description, 320),
  };
  const hasPairingData = Object.values(pairing).some((value) => value !== null);
  const mealType = normalizeMealType(row.meal_type, null);
  const nutrition = {
    calories: toNullableNumber(row.calories_kcal),
    protein: toNullableNumber(row.protein_g),
    carbohydrates: toNullableNumber(row.carbohydrates_g),
    fat: toNullableNumber(row.fat_g),
    fiber: toNullableNumber(row.fiber_g),
    sugar: toNullableNumber(row.sugar_g),
  };

  return {
    id: row.id,
    title,
    description,
    cookingTime: toNumber(row.cooking_time, 0),
    servings: toNumber(row.servings, 0),
    vibe,
    ingredients,
    seasoning,
    instructions,
    tags,
    chefTips,
    imagePath: row.image_path ?? undefined,
    imageModel: row.image_model ?? undefined,
    userId: row.user_id ?? undefined,
    authorName: normalizeAuthorName(row.author_name) ?? undefined,
    pairing: hasPairingData ? pairing : undefined,
    mealType,
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
    nutrition,
  };
}

function buildWhereClause(options: {
  language: SupportedRecipeLanguage;
  search: string;
  userId?: string;
  favoriteUserId?: string;
  withImage?: boolean;
  startIndex: number;
}): { clause: string; params: string[]; nextIndex: number } {
  const where: string[] = [];
  const params: string[] = [];
  let idx = options.startIndex;

  where.push(`r.language_code = $${idx}`);
  params.push(options.language);
  idx += 1;

  if (options.userId) {
    where.push(`r.user_id = $${idx}`);
    params.push(options.userId);
    idx += 1;
  }

  if (options.favoriteUserId) {
    where.push(
      `EXISTS (SELECT 1 FROM recipe_favorites rf WHERE rf.recipe_id = r.id AND rf.user_id = $${idx})`
    );
    params.push(options.favoriteUserId);
    idx += 1;
  }

  if (options.search) {
    where.push(
      `(r.title ILIKE $${idx} OR r.description ILIKE $${idx + 1})`
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
    r.vibe,
    r.ingredients,
    r.seasoning,
    r.instructions,
    r.tags,
    r.chef_tips,
    r.user_id,
    r.author_name,
    r.pairing_type,
    r.pairing_name,
    r.pairing_note,
    r.pairing_description,
    r.meal_type,
    r.cuisine_id::int AS cuisine_id,
    r.calories_kcal,
    r.protein_g,
    r.carbohydrates_g,
    r.fat_g,
    r.fiber_g,
    r.sugar_g,
    r.created_at,
    r.updated_at,
    rim.image_path,
    rim.image_model,
    r.language_code,
    COALESCE(ci.name, c.name) AS cuisine_name,
    c.slug AS cuisine_slug
  FROM recipes r
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
    ON c.id = ci.cuisine_id AND ci.language_code = $1
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
  await ensureRecipeNutritionSchema(db);
  if (options.favoriteUserId) {
    await ensureRecipeFavoritesSchema(db);
  }

  const language = normalizeLanguage(options.lang);
  const page = normalizePage(options.page);
  const limit = normalizeLimit(options.limit, 12);
  const offset = (page - 1) * limit;
  const search = (options.search ?? '').trim();

  const selectWhere = buildWhereClause({
    language,
    search,
    userId: options.userId,
    favoriteUserId: options.favoriteUserId,
    withImage: options.withImage,
    startIndex: 2,
  });

  const dataParams: Array<string | number> = [language, ...selectWhere.params];
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
    language,
    search,
    userId: options.userId,
    favoriteUserId: options.favoriteUserId,
    withImage: options.withImage,
    startIndex: 1,
  });
  const countResult = await db.query<{ count: string }>(
    `
      SELECT COUNT(*) AS count
      FROM recipes r
      ${countWhere.clause}
    `,
    countWhere.params
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
  await ensureRecipeNutritionSchema(db);

  const language = normalizeLanguage(lang);
  const queryByIdAndLanguage = async (targetRecipeId: string): Promise<RecipeRow | null> => {
    const result = await db.query<RecipeRow>(
      `
        ${RECIPE_SELECT_SQL}
        WHERE r.id = $2 AND r.language_code = $3
        LIMIT 1
      `,
      [language, targetRecipeId, language]
    );
    return result.rows[0] ?? null;
  };

  const directMatch = await queryByIdAndLanguage(recipeId);
  if (directMatch) {
    return toRecipeView(directMatch);
  }

  const siblingRecipeId = getSiblingRecipeIdByLanguage(recipeId, language);
  if (!siblingRecipeId) {
    return null;
  }

  const siblingMatch = await queryByIdAndLanguage(siblingRecipeId);
  return siblingMatch ? toRecipeView(siblingMatch) : null;
}

export async function updateRecipeById(
  db: PgClientLike,
  recipeId: string,
  userId: string,
  input: RecipeMutationInput
): Promise<boolean> {
  await ensureRecipeNutritionSchema(db);

  const existingResult = await db.query<MutableRecipeRow>(
    `
      SELECT id, title, description, cooking_time, servings, vibe,
             ingredients, seasoning, instructions, tags, chef_tips, author_name,
             pairing_type, pairing_name, pairing_note, pairing_description,
             meal_type,
             cuisine_id::int AS cuisine_id,
             calories_kcal,
             protein_g, carbohydrates_g, fat_g, fiber_g, sugar_g
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

  const nutrition = normalizeNutritionInput(input);
  const fallbackNutrition = normalizeNutritionInput(existing);
  const pairing = normalizePairingInput(input);
  const fallbackPairing = normalizePairingInput(existing);
  const mealType = normalizeMealTypeInput(input);
  const fallbackMealType = normalizeMealTypeInput(existing);

  const payload = {
    title: input.title ?? existing.title,
    description: input.description ?? existing.description ?? '',
    cooking_time: input.cookingTime ?? input.cooking_time ?? existing.cooking_time ?? 30,
    servings: input.servings ?? existing.servings ?? 1,
    vibe: normalizeRecipeVibe(input.vibe ?? existing.vibe, 'comfort'),
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
    author_name:
      normalizeAuthorName(input.authorName ?? input.author_name) ??
      normalizeAuthorName(existing.author_name),
    pairing_type: pairing.type ?? fallbackPairing.type,
    pairing_name: pairing.name ?? fallbackPairing.name,
    pairing_note: pairing.note ?? fallbackPairing.note,
    pairing_description: pairing.description ?? fallbackPairing.description,
    meal_type: mealType ?? fallbackMealType,
    cuisine_id: input.cuisineId ?? input.cuisine_id ?? existing.cuisine_id ?? null,
    calories_kcal: nutrition.calories ?? fallbackNutrition.calories,
    protein_g: nutrition.protein ?? fallbackNutrition.protein,
    carbohydrates_g: nutrition.carbohydrates ?? fallbackNutrition.carbohydrates,
    fat_g: nutrition.fat ?? fallbackNutrition.fat,
    fiber_g: nutrition.fiber ?? fallbackNutrition.fiber,
    sugar_g: nutrition.sugar ?? fallbackNutrition.sugar,
  };

  const updateResult = await db.query<{ id: string }>(
    `
      UPDATE recipes
      SET
        title = $1,
        description = $2,
        cooking_time = $3,
        servings = $4,
        vibe = $5,
        ingredients = $6,
        seasoning = $7,
        instructions = $8,
        tags = $9,
        chef_tips = $10,
        author_name = $11,
        pairing_type = $12,
        pairing_name = $13,
        pairing_note = $14,
        pairing_description = $15,
        meal_type = $16,
        cuisine_id = $17,
        calories_kcal = $18,
        protein_g = $19,
        carbohydrates_g = $20,
        fat_g = $21,
        fiber_g = $22,
        sugar_g = $23,
        updated_at = NOW()
      WHERE id = $24 AND user_id = $25
      RETURNING id
    `,
    [
      payload.title,
      payload.description,
      payload.cooking_time,
      payload.servings,
      payload.vibe,
      payload.ingredients,
      payload.seasoning,
      payload.instructions,
      payload.tags,
      payload.chef_tips,
      payload.author_name,
      payload.pairing_type,
      payload.pairing_name,
      payload.pairing_note,
      payload.pairing_description,
      payload.meal_type,
      payload.cuisine_id,
      payload.calories_kcal,
      payload.protein_g,
      payload.carbohydrates_g,
      payload.fat_g,
      payload.fiber_g,
      payload.sugar_g,
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
    await client.query('DELETE FROM recipe_images WHERE recipe_id = $1', [recipeId]);
    const recipeDelete = await client.query<{ id: string }>(
      'DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING id',
      [recipeId, userId]
    );
    return recipeDelete.rowCount === 1;
  });

  return { deleted, imagePaths };
}

export async function listFavoriteRecipeIds(
  db: PgClientLike,
  userId: string
): Promise<string[]> {
  await ensureRecipeFavoritesSchema(db);
  const result = await db.query<{ recipe_id: string }>(
    `
      SELECT recipe_id
      FROM recipe_favorites
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows.map((row) => row.recipe_id);
}

export async function setRecipeFavorite(
  db: PgClientLike,
  userId: string,
  recipeId: string,
  favorite: boolean
): Promise<boolean> {
  await ensureRecipeFavoritesSchema(db);

  if (!favorite) {
    await db.query(
      `
        DELETE FROM recipe_favorites
        WHERE user_id = $1 AND recipe_id = $2
      `,
      [userId, recipeId]
    );
    return false;
  }

  await db.query(
    `
      INSERT INTO recipe_favorites (user_id, recipe_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, recipe_id)
      DO UPDATE SET created_at = EXCLUDED.created_at
    `,
    [userId, recipeId]
  );
  return true;
}
