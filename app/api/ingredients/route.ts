import { NextRequest, NextResponse } from 'next/server';
import { getWorkerApiUrl } from '@/lib/config';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';
    const category = searchParams.get('category');
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';

    // 构建查询参数
    const params = new URLSearchParams();
    if (language) params.append('lang', language);
    if (category) params.append('category', category);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    // 直接调用云端数据库
    const response = await fetch(getWorkerApiUrl(`/api/ingredients?${params}`), {
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
    console.error('❌ 获取食材数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取食材数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 获取食材分类的 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, language = 'en' } = body;

    if (action === 'getCategories') {
      // 使用categories API而不是在这里处理
      return NextResponse.json(
        { success: false, error: '请使用 /api/categories 端点获取分类数据' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '无效的操作' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ POST /api/ingredients 错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '处理请求失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
