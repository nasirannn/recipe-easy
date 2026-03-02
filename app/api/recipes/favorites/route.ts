import { NextRequest, NextResponse } from 'next/server';
import {
  listFavoriteRecipeIds,
  setRecipeFavorite,
} from '@/lib/server/recipes';
import { getPostgresPool } from '@/lib/server/postgres';
import { validateUserId } from '@/lib/utils/validation';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

function normalizeRecipeId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 120);
}

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization') || '';
  if (!value.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}

async function resolveAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) {
    return null;
  }

  return data.user.id;
}

export async function GET(request: NextRequest) {
  try {
    const authUserId = await resolveAuthenticatedUserId(request);
    if (!authUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') ?? undefined;

    if (!validateUserId(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    if (userId !== authUserId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const db = getPostgresPool();
    const favoriteRecipeIds = await listFavoriteRecipeIds(db, userId);
    return NextResponse.json({
      success: true,
      favoriteRecipeIds,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch favorite recipes:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorite recipes', details },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUserId = await resolveAuthenticatedUserId(request);
    if (!authUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      userId?: string;
      recipeId?: string;
      favorite?: boolean;
    };

    const userId = body.userId;
    if (!validateUserId(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    if (userId !== authUserId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const recipeId = normalizeRecipeId(body.recipeId);
    if (!recipeId) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    if (typeof body.favorite !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'favorite must be a boolean' },
        { status: 400 }
      );
    }

    const db = getPostgresPool();
    const recipeExists = await db.query<{ id: string }>(
      'SELECT id FROM recipes WHERE id = $1 LIMIT 1',
      [recipeId]
    );

    if (recipeExists.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    const favorite = await setRecipeFavorite(db, userId, recipeId, body.favorite);

    return NextResponse.json({
      success: true,
      recipeId,
      favorite,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update favorite recipe:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to update favorite recipe', details },
      { status: 500 }
    );
  }
}
