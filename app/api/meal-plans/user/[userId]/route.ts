import { NextRequest, NextResponse } from 'next/server';
import { listMealPlansByUser } from '@/lib/server/meal-plans';
import { validateUserId } from '@/lib/utils/validation';
import { getPostgresPool } from '@/lib/server/postgres';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

function toNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization') || '';
  if (!value.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    if (!validateUserId(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
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

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (data.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = toNumber(searchParams.get('page'));
    const limit = toNumber(searchParams.get('limit'));
    const lang = searchParams.get('lang') ?? 'all';

    const db = getPostgresPool();
    const result = await listMealPlansByUser(db, {
      userId,
      page,
      limit,
      languageCode: lang,
    });

    return NextResponse.json({
      success: true,
      mealPlans: result.results,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      language: result.languageCode,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch user meal plans:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user meal plans', details },
      { status: 500 }
    );
  }
}
