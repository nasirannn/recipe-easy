import { NextRequest, NextResponse } from 'next/server';
import { getWorkerApiUrl } from '@/lib/config';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 直接调用云端数据库
    const response = await fetch(getWorkerApiUrl('/api/cuisines'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching cuisines:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cuisines',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
