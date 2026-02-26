import { NextRequest, NextResponse } from 'next/server';
import { listCategories } from '@/lib/server/catalog';
import { getPostgresPool } from '@/lib/server/postgres';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') ?? 'en';

    const db = getPostgresPool();
    const { language, results } = await listCategories(db, lang);
    return NextResponse.json({
      success: true,
      results,
      total: results.length,
      language,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch categories:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories', details },
      { status: 500 }
    );
  }
}
