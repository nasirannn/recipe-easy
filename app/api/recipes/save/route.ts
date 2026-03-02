import { NextRequest, NextResponse } from 'next/server';
import { generateImageId } from '@/lib/utils/id-generator';
import { getPostgresPool } from '@/lib/server/postgres';
import { ensureRecipeNutritionSchema } from '@/lib/server/recipes';
import { validateUserId } from '@/lib/utils/validation';
import { supabase } from '@/lib/supabase';
import {
  buildR2PublicUrl,
  extractR2ObjectKey,
  isR2S3Configured,
  uploadImageFromUrlToR2,
} from '@/lib/server/r2';
import { normalizePairingType } from '@/lib/pairing';
import { normalizeMealType, type MealType } from '@/lib/meal-type';
import { normalizeRecipeVibe, type RecipeVibe } from '@/lib/vibe';

export const runtime = 'nodejs';

interface SaveRecipeRequest {
  recipe?: {
    id: string;
    title: string;
    description?: string;
    cookingTime?: number;
    cooking_time?: number;
    servings?: number;
    vibe?: string;
    ingredients?: unknown[];
    seasoning?: unknown[];
    instructions?: unknown[];
    tags?: unknown[];
    chefTips?: unknown[];
    chef_tips?: unknown[];
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
    mealType?: MealType | string | null;
    meal_type?: MealType | string | null;
    cuisineId?: number;
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
    protein_g?: number | null;
    carbohydrates_g?: number | null;
    fat_g?: number | null;
    fiber_g?: number | null;
    sugar_g?: number | null;
    calories_kcal?: number | null;
  };
  recipes?: Array<Record<string, unknown>>;
  userId?: string;
  authorName?: string;
  language?: string;
}

type SaveRecipeInput = {
  id: string;
  title: string;
  description: string;
  cookingTime: number;
  servings: number;
  vibe: RecipeVibe;
  ingredients: unknown[];
  seasoning: unknown[];
  instructions: unknown[];
  tags: unknown[];
  chefTips: unknown[];
  imagePath?: string;
  imageModel?: string;
  authorName?: string;
  pairing: {
    type: string | null;
    name: string | null;
    note: string | null;
    description: string | null;
  };
  mealType: MealType | null;
  cuisineId: number;
  nutrition: {
    calories: number | null;
    protein: number | null;
    carbohydrates: number | null;
    fat: number | null;
    fiber: number | null;
    sugar: number | null;
  };
};

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization') || '';
  if (!value.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}

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

function parseArray(value: unknown): unknown[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
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

function normalizeAuthorName(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
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

function normalizeRecipeForDatabase(recipe: Record<string, unknown>): SaveRecipeInput {
  const cookingTimeRaw = recipe.cookingTime ?? recipe.cooking_time;
  const servingsRaw = recipe.servings;
  const cuisineIdRaw = recipe.cuisineId ?? recipe.cuisine_id;
  const chefTipsRaw = recipe.chefTips ?? recipe.chef_tips;

  const cookingTimeNum = Number(cookingTimeRaw);
  const servingsNum = Number(servingsRaw);
  const cuisineIdNum = Number(cuisineIdRaw);
  const nutritionRaw =
    recipe.nutrition && typeof recipe.nutrition === 'object'
      ? (recipe.nutrition as Record<string, unknown>)
      : null;
  const pairingRaw =
    recipe.pairing && typeof recipe.pairing === 'object'
      ? (recipe.pairing as Record<string, unknown>)
      : null;
  const mealType = normalizeMealType(recipe.mealType ?? recipe.meal_type, null);

  const cookingTime = Number.isFinite(cookingTimeNum) ? cookingTimeNum : 30;
  const servings = Number.isFinite(servingsNum) ? servingsNum : 4;
  const cuisineId = Number.isFinite(cuisineIdNum) ? cuisineIdNum : 9;

  return {
    id: String(recipe.id ?? ''),
    title: String(recipe.title ?? ''),
    description: String(recipe.description ?? ''),
    cookingTime,
    servings,
    vibe: normalizeRecipeVibe(recipe.vibe, 'comfort'),
    ingredients: parseArray(recipe.ingredients),
    seasoning: parseArray(recipe.seasoning),
    instructions: parseArray(recipe.instructions),
    tags: parseArray(recipe.tags),
    chefTips: parseArray(chefTipsRaw),
    imagePath: typeof recipe.imagePath === 'string' ? recipe.imagePath : undefined,
    imageModel: typeof recipe.imageModel === 'string' ? recipe.imageModel : undefined,
    authorName: normalizeAuthorName(recipe.authorName ?? recipe.author_name),
    pairing: {
      type: normalizePairingType(
        pairingRaw?.type ?? recipe.pairingType ?? recipe.pairing_type
      ),
      name: normalizePairingText(
        pairingRaw?.name ?? recipe.pairingName ?? recipe.pairing_name,
        80
      ),
      note: normalizePairingText(
        pairingRaw?.note ?? recipe.pairingNote ?? recipe.pairing_note,
        120
      ),
      description: normalizePairingText(
        pairingRaw?.description ?? recipe.pairingDescription ?? recipe.pairing_description,
        320
      ),
    },
    mealType,
    cuisineId,
    nutrition: {
      calories: pickNullableNumber(nutritionRaw?.calories, recipe.calories, recipe.calories_kcal),
      protein: pickNullableNumber(nutritionRaw?.protein, recipe.protein, recipe.protein_g),
      carbohydrates: pickNullableNumber(nutritionRaw?.carbohydrates, recipe.carbohydrates, recipe.carbohydrates_g),
      fat: pickNullableNumber(nutritionRaw?.fat, recipe.fat, recipe.fat_g),
      fiber: pickNullableNumber(nutritionRaw?.fiber, recipe.fiber, recipe.fiber_g),
      sugar: pickNullableNumber(nutritionRaw?.sugar, recipe.sugar, recipe.sugar_g),
    },
  };
}

async function upsertRecipeImage(
  recipeId: string,
  userId: string,
  imagePath: string,
  imageModel: string
): Promise<boolean> {
  const db = getPostgresPool();
  const existing = await db.query<{ id: string; image_path: string | null }>(
    `
      SELECT id, image_path
      FROM recipe_images
      WHERE recipe_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [recipeId]
  );

  const current = existing.rows[0];
  if (current?.id) {
    await db.query(
      `
        UPDATE recipe_images
        SET image_path = $1, image_model = $2, created_at = NOW()
        WHERE id = $3
      `,
      [imagePath, imageModel, current.id]
    );

    return current.image_path !== imagePath;
  }

  await db.query(
    `
      INSERT INTO recipe_images (id, user_id, recipe_id, image_path, image_model, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
    [generateImageId(), userId, recipeId, imagePath, imageModel]
  );

  return true;
}

async function saveRecipeToDatabase(request: NextRequest) {
  const body = (await request.json()) as SaveRecipeRequest;
  const { recipe, recipes, userId, authorName, language } = body;
  const requestAuthorName = normalizeAuthorName(authorName);

  if (!validateUserId(userId)) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid userId in request body' },
      { status: 400 }
    );
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (authData.user.id !== userId) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const db = getPostgresPool();
  await ensureRecipeNutritionSchema(db);

  let recipeArray: Array<Record<string, unknown>> = [];
  if (Array.isArray(recipes)) {
    recipeArray = recipes;
  } else if (recipes && typeof recipes === 'object') {
    recipeArray = [recipes];
  } else if (recipe && typeof recipe === 'object') {
    recipeArray = [recipe as unknown as Record<string, unknown>];
  }

  if (recipeArray.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No recipe data provided' },
      { status: 400 }
    );
  }

  const savedRecipes: SaveRecipeInput[] = [];
  let hasUpdatedImage = false;
  let alreadyExists = false;
  const sourceLanguage = (language ?? 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';

  for (const rawRecipe of recipeArray) {
    const normalizedRecipe = normalizeRecipeForDatabase(rawRecipe);
    const resolvedAuthorName = normalizedRecipe.authorName ?? requestAuthorName;
    normalizedRecipe.authorName = resolvedAuthorName;
    if (!normalizedRecipe.id || !normalizedRecipe.title) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID and title are required' },
        { status: 400 }
      );
    }

    const existing = await db.query<{ id: string }>(
      'SELECT id FROM recipes WHERE id = $1 LIMIT 1',
      [normalizedRecipe.id]
    );
    const recipeExists = existing.rowCount > 0;
    alreadyExists = alreadyExists || recipeExists;

    if (recipeExists) {
      await db.query(
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
            user_id = $11,
            author_name = $12,
            pairing_type = $13,
            pairing_name = $14,
            pairing_note = $15,
            pairing_description = $16,
            meal_type = $17,
            cuisine_id = $18,
            calories_kcal = $19,
            protein_g = $20,
            carbohydrates_g = $21,
            fat_g = $22,
            fiber_g = $23,
            sugar_g = $24,
            language_code = $25,
            updated_at = NOW()
          WHERE id = $26
        `,
        [
          normalizedRecipe.title,
          normalizedRecipe.description,
          normalizedRecipe.cookingTime,
          normalizedRecipe.servings,
          normalizedRecipe.vibe,
          JSON.stringify(normalizedRecipe.ingredients),
          JSON.stringify(normalizedRecipe.seasoning),
          JSON.stringify(normalizedRecipe.instructions),
          JSON.stringify(normalizedRecipe.tags),
          JSON.stringify(normalizedRecipe.chefTips),
          userId,
          resolvedAuthorName ?? null,
          normalizedRecipe.pairing.type,
          normalizedRecipe.pairing.name,
          normalizedRecipe.pairing.note,
          normalizedRecipe.pairing.description,
          normalizedRecipe.mealType,
          normalizedRecipe.cuisineId,
          normalizedRecipe.nutrition.calories,
          normalizedRecipe.nutrition.protein,
          normalizedRecipe.nutrition.carbohydrates,
          normalizedRecipe.nutrition.fat,
          normalizedRecipe.nutrition.fiber,
          normalizedRecipe.nutrition.sugar,
          sourceLanguage,
          normalizedRecipe.id,
        ]
      );
    } else {
      await db.query(
        `
          INSERT INTO recipes (
            id, title, description, cooking_time, servings, vibe,
            ingredients, seasoning, instructions, tags, chef_tips,
            user_id, language_code, author_name, pairing_type, pairing_name, pairing_note, pairing_description,
            meal_type,
            cuisine_id, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugar_g,
            created_at, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17, $18,
            $19,
            $20, $21, $22, $23, $24, $25, $26,
            NOW(), NOW()
          )
        `,
        [
          normalizedRecipe.id,
          normalizedRecipe.title,
          normalizedRecipe.description,
          normalizedRecipe.cookingTime,
          normalizedRecipe.servings,
          normalizedRecipe.vibe,
          JSON.stringify(normalizedRecipe.ingredients),
          JSON.stringify(normalizedRecipe.seasoning),
          JSON.stringify(normalizedRecipe.instructions),
          JSON.stringify(normalizedRecipe.tags),
          JSON.stringify(normalizedRecipe.chefTips),
          userId,
          sourceLanguage,
          resolvedAuthorName ?? null,
          normalizedRecipe.pairing.type,
          normalizedRecipe.pairing.name,
          normalizedRecipe.pairing.note,
          normalizedRecipe.pairing.description,
          normalizedRecipe.mealType,
          normalizedRecipe.cuisineId,
          normalizedRecipe.nutrition.calories,
          normalizedRecipe.nutrition.protein,
          normalizedRecipe.nutrition.carbohydrates,
          normalizedRecipe.nutrition.fat,
          normalizedRecipe.nutrition.fiber,
          normalizedRecipe.nutrition.sugar,
        ]
      );
    }

    if (normalizedRecipe.imagePath) {
      let resolvedImagePath = normalizeImagePathForStorage(normalizedRecipe.imagePath);

      if (/^https?:\/\//i.test(resolvedImagePath) && !extractR2ObjectKey(resolvedImagePath) && isR2S3Configured()) {
        try {
          const uploaded = await uploadImageFromUrlToR2({
            sourceUrl: resolvedImagePath,
            userId,
            recipeId: normalizedRecipe.id,
            imageModel: normalizedRecipe.imageModel,
          });
          resolvedImagePath = normalizeImagePathForStorage(uploaded.publicUrl);
        } catch (error) {
          console.error('Failed to upload recipe image to R2, fallback to source URL:', error);
        }
      }

      const imageChanged = await upsertRecipeImage(
        normalizedRecipe.id,
        userId,
        resolvedImagePath,
        normalizedRecipe.imageModel ?? 'unknown'
      );
      hasUpdatedImage = hasUpdatedImage || imageChanged;

      normalizedRecipe.imagePath = resolvedImagePath;
    }

    savedRecipes.push(normalizedRecipe);
  }

  return NextResponse.json({
    success: true,
    recipes: savedRecipes,
    count: savedRecipes.length,
    alreadyExists,
    hasUpdatedImage,
  });
}

export async function POST(req: NextRequest) {
  try {
    return await saveRecipeToDatabase(req);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '保存菜谱失败',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
