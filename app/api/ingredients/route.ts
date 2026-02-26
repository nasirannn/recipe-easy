import { NextRequest, NextResponse } from 'next/server';
import { listIngredients } from '@/lib/server/catalog';
import { getPostgresPool } from '@/lib/server/postgres';

export const runtime = 'nodejs';

function toNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') ?? 'en';
    const category = searchParams.get('category');
    const limit = toNumber(searchParams.get('limit'));
    const offset = toNumber(searchParams.get('offset'));

    const db = getPostgresPool();
    const result = await listIngredients(db, {
      lang,
      category,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      results: result.results,
      total: result.results.length,
      language: result.language,
      pagination: {
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch ingredients:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ingredients', details },
      { status: 500 }
    );
  }
}
