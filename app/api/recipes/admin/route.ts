import { NextRequest, NextResponse } from 'next/server';
import { getWorkerApiUrl } from '@/lib/config';

// 配置 Edge Runtime 以支持 Cloudflare Pages
export const runtime = 'edge';

/**
 * GET /api/recipes/admin
 * 获取管理员创建的菜谱列表
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    const lang = searchParams.get('lang') || 'en';
    const search = searchParams.get('search');
    const cuisineId = searchParams.get('cuisineId');

    // 构建查询参数
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('offset', offset);
    params.append('lang', lang);
    if (search) params.append('search', search);
    if (cuisineId) params.append('cuisineId', cuisineId);

    const workerUrl = getWorkerApiUrl(`/api/recipes/admin?${params}`);


    // 直接调用云端数据库的管理员菜谱接口
    const response = await fetch(workerUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });



    if (!response.ok) {
      const errorText = await response.text();
      console.error('Worker error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching admin recipes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin recipes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 