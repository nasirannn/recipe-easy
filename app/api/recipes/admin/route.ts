import { NextRequest, NextResponse } from 'next/server';

/**
 * Backward-compatible endpoint.
 * This route no longer has admin-only behavior and simply redirects callers
 * to the standard recipes list API.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams(searchParams);

  if (!params.get('type')) {
    params.set('type', 'latest');
  }
  if (!params.get('page')) {
    params.set('page', '1');
  }
  if (!params.get('limit')) {
    params.set('limit', '10');
  }

  return NextResponse.redirect(new URL(`/api/recipes?${params.toString()}`, request.url), 307);
}
