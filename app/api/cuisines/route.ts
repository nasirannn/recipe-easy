import { NextRequest, NextResponse } from 'next/server';
import { getWorkerApiUrl } from '@/lib/config';

// 强制动态渲染
// 启用缓存以提高性能
export const revalidate = 3600; // 1小时缓存

export async function GET(request: NextRequest) {
  try {
    // 从请求中获取语言参数
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    
    // 构建 Worker API URL，包含语言参数
    const workerUrl = `${getWorkerApiUrl('/api/cuisines')}?lang=${lang}`;
    
    // 直接调用云端数据库
    const response = await fetch(workerUrl, {
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
