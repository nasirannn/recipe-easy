import { NextRequest, NextResponse } from 'next/server';

// 配置 Edge Runtime 以支持 Cloudflare Pages
export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const lang = searchParams.get('lang') || 'en';
    const offset = (page - 1) * limit;
    const { userId } = await params;
    
    const response = await fetch(
      `${process.env.WORKER_URL || 'https://api.recipe-easy.com'}/api/recipes/user/${userId}?page=${page}&limit=${limit}&lang=${lang}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch user recipes');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Get user recipes error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user recipes' 
    }, { status: 500 });
  }
} 