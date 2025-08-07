import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    const response = await fetch(
      `${process.env.WORKER_URL || 'https://api.recipe-easy.com'}/api/recipes/user/${params.userId}?page=${page}&limit=${limit}`,
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