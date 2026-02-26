import { NextRequest, NextResponse } from 'next/server';
import { generateImageId } from '@/lib/utils/id-generator';
import { getPostgresPool } from '@/lib/server/postgres';
import { translateRecipeAsync } from '@/lib/services/translation';
import { validateUserId } from '@/lib/utils/validation';
import {
  buildR2PublicUrl,
  extractR2ObjectKey,
  isR2S3Configured,
  uploadImageFromUrlToR2,
} from '@/lib/server/r2';

export const runtime = 'nodejs';

interface SaveRecipeRequest {
  recipe?: {
    id: string;
    title: string;
    description?: string;
    cookingTime?: number;
    cooking_time?: number;
    servings?: number;
    difficulty?: string;
    ingredients?: unknown[];
    seasoning?: unknown[];
    instructions?: unknown[];
    tags?: unknown[];
    chefTips?: unknown[];
    chef_tips?: unknown[];
    imagePath?: string;
    imageModel?: string;
    cuisineId?: number;
  };
  recipes?: Array<Record<string, unknown>>;
  userId?: string;
  language?: string;
}

type SaveRecipeInput = {
  id: string;
  title: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: string;
  ingredients: unknown[];
  seasoning: unknown[];
  instructions: unknown[];
  tags: unknown[];
  chefTips: unknown[];
  imagePath?: string;
  imageModel?: string;
  cuisineId: number;
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

function normalizeStringArray(values: unknown[]): string[] {
  return values
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (typeof item === 'number') {
        return String(item);
      }
      if (item && typeof item === 'object' && 'name' in (item as Record<string, unknown>)) {
        const name = (item as Record<string, unknown>).name;
        return typeof name === 'string' ? name : '';
      }
      return '';
    })
    .filter(Boolean);
}

function normalizeRecipeForDatabase(recipe: Record<string, unknown>): SaveRecipeInput {
  const cookingTimeRaw = recipe.cookingTime ?? recipe.cooking_time;
  const servingsRaw = recipe.servings;
  const cuisineIdRaw = recipe.cuisineId ?? recipe.cuisine_id;
  const chefTipsRaw = recipe.chefTips ?? recipe.chef_tips;

  const cookingTimeNum = Number(cookingTimeRaw);
  const servingsNum = Number(servingsRaw);
  const cuisineIdNum = Number(cuisineIdRaw);

  const cookingTime = Number.isFinite(cookingTimeNum) ? cookingTimeNum : 30;
  const servings = Number.isFinite(servingsNum) ? servingsNum : 4;
  const cuisineId = Number.isFinite(cuisineIdNum) ? cuisineIdNum : 9;

  return {
    id: String(recipe.id ?? ''),
    title: String(recipe.title ?? ''),
    description: String(recipe.description ?? ''),
    cookingTime,
    servings,
    difficulty: String(recipe.difficulty ?? 'easy'),
    ingredients: parseArray(recipe.ingredients),
    seasoning: parseArray(recipe.seasoning),
    instructions: parseArray(recipe.instructions),
    tags: parseArray(recipe.tags),
    chefTips: parseArray(chefTipsRaw),
    imagePath: typeof recipe.imagePath === 'string' ? recipe.imagePath : undefined,
    imageModel: typeof recipe.imageModel === 'string' ? recipe.imageModel : undefined,
    cuisineId,
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
  const db = getPostgresPool();
  const body = (await request.json()) as SaveRecipeRequest;
  const { recipe, recipes, userId, language } = body;

  if (!validateUserId(userId)) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid userId in request body' },
      { status: 400 }
    );
  }

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
  const newlySavedRecipes: SaveRecipeInput[] = [];
  let hasUpdatedImage = false;
  let alreadyExists = false;

  for (const rawRecipe of recipeArray) {
    const normalizedRecipe = normalizeRecipeForDatabase(rawRecipe);
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
            difficulty = $5,
            ingredients = $6,
            seasoning = $7,
            instructions = $8,
            tags = $9,
            chef_tips = $10,
            user_id = $11,
            cuisine_id = $12,
            updated_at = NOW()
          WHERE id = $13
        `,
        [
          normalizedRecipe.title,
          normalizedRecipe.description,
          normalizedRecipe.cookingTime,
          normalizedRecipe.servings,
          normalizedRecipe.difficulty,
          JSON.stringify(normalizedRecipe.ingredients),
          JSON.stringify(normalizedRecipe.seasoning),
          JSON.stringify(normalizedRecipe.instructions),
          JSON.stringify(normalizedRecipe.tags),
          JSON.stringify(normalizedRecipe.chefTips),
          userId,
          normalizedRecipe.cuisineId,
          normalizedRecipe.id,
        ]
      );
    } else {
      await db.query(
        `
          INSERT INTO recipes (
            id, title, description, cooking_time, servings, difficulty,
            ingredients, seasoning, instructions, tags, chef_tips,
            user_id, cuisine_id, created_at, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, NOW(), NOW()
          )
        `,
        [
          normalizedRecipe.id,
          normalizedRecipe.title,
          normalizedRecipe.description,
          normalizedRecipe.cookingTime,
          normalizedRecipe.servings,
          normalizedRecipe.difficulty,
          JSON.stringify(normalizedRecipe.ingredients),
          JSON.stringify(normalizedRecipe.seasoning),
          JSON.stringify(normalizedRecipe.instructions),
          JSON.stringify(normalizedRecipe.tags),
          JSON.stringify(normalizedRecipe.chefTips),
          userId,
          normalizedRecipe.cuisineId,
        ]
      );

      newlySavedRecipes.push(normalizedRecipe);
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

  if (newlySavedRecipes.length > 0) {
    const sourceLanguage = (language ?? 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
    const targetLanguage = sourceLanguage === 'zh' ? 'en' : 'zh';

    // Fire-and-forget translation to avoid blocking save latency.
    void (async () => {
      const tasks = newlySavedRecipes.map((savedRecipe) =>
        translateRecipeAsync(
          {
            id: savedRecipe.id,
            title: savedRecipe.title,
            description: savedRecipe.description,
            difficulty: savedRecipe.difficulty,
            servings: savedRecipe.servings,
            cookingTime: savedRecipe.cookingTime,
            ingredients: normalizeStringArray(savedRecipe.ingredients),
            seasoning: normalizeStringArray(savedRecipe.seasoning),
            instructions: normalizeStringArray(savedRecipe.instructions),
            chefTips: normalizeStringArray(savedRecipe.chefTips),
            tags: normalizeStringArray(savedRecipe.tags),
            language: sourceLanguage,
          },
          targetLanguage,
          db
        )
      );

      await Promise.allSettled(tasks);
    })();
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
