import { NextRequest, NextResponse } from 'next/server';
import { listRecipes } from '@/lib/server/recipes';
import { getPostgresPool } from '@/lib/server/postgres';
import { validateUserId } from '@/lib/utils/validation';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

function toNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toBoolean(value: string | null): boolean {
  if (!value) {
    return false;
  }
  return value === '1' || value.toLowerCase() === 'true';
}

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization') || '';
  if (!value.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = toNumber(searchParams.get('page'));
    const limit = toNumber(searchParams.get('limit'));
    const lang = searchParams.get('lang') ?? 'en';
    const search = searchParams.get('search') ?? '';
    const withImage = toBoolean(searchParams.get('withImage'));
    const favoriteUserId = (searchParams.get('favoriteUserId') ?? '').trim() || undefined;

    if (favoriteUserId && !validateUserId(favoriteUserId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid favorite user ID' },
        { status: 400 }
      );
    }

    if (favoriteUserId) {
      const token = getBearerToken(request);
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user?.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (data.user.id !== favoriteUserId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    const db = getPostgresPool();
    const result = await listRecipes(db, {
      page,
      limit,
      lang,
      search,
      withImage,
      favoriteUserId,
    });
    return NextResponse.json({
      success: true,
      results: result.results,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      language: result.language,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch recipes:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipes', details },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Use /api/recipes/save to create recipes' },
    { status: 405 }
  );
}
