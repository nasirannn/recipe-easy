/**
 * 菜谱API路由
 * 
 * 处理菜谱列表的获取和创建
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWorkerApiUrl } from '@/lib/config';

// 强制动态渲染

// 注意：此API路由现在完全依赖Worker API获取数据
// 不再使用本地静态数据

/**
 * GET /api/recipes
 * 获取菜谱列表
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

    // 直接调用云端数据库
    const response = await fetch(getWorkerApiUrl(`/api/recipes?${params}`), {
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
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes
 * 创建新菜谱 - 通过Worker API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 调用Worker API创建菜谱
    const response = await fetch(getWorkerApiUrl('/api/recipes'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}
