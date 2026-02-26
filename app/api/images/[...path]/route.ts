import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getR2PublicBase(): string {
  const value =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    '';
  return value.replace(/\/+$/, '');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const key = path.join('/').replace(/^\/+/, '');

  if (!key) {
    return NextResponse.json({ error: 'Image path is required' }, { status: 400 });
  }

  const base = getR2PublicBase();
  if (!base) {
    return NextResponse.json(
      { error: 'R2 public URL not configured' },
      { status: 503 }
    );
  }

  const target = `${base}/${key}`;
  return NextResponse.redirect(target, 307);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
