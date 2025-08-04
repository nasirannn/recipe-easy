/**
 * 菜谱详情API路由
 * 
 * 处理单个菜谱的获取、更新和删除
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWorkerApiUrl } from '@/lib/config';

export const runtime = 'edge';

// 菜谱类型定义 - 与route.ts中保持一致
interface Recipe {
  id: number;
  title: string;
  image_url: string | null;
  description: string | null;
  tags: string | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: string | null;
  ingredients: string;
  seasoning: string | null;
  instructions: string;
  chef_tips: string | null;
  cuisine_id: number | null;
  cuisine_name?: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// 更新菜谱输入类型
interface UpdateRecipeInput {
  title?: string;
  image_url?: string | null;
  description?: string | null;
  tags?: string[];
  cook_time?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  ingredients?: any[] | string;
  seasoning?: any[] | string | null;
  instructions?: any[] | string;
  chef_tips?: string | null;
  cuisine_id?: number | null;
}

// 注意：此API路由现在完全依赖Worker API获取数据
// 不再使用本地静态数据

/**
 * GET /api/recipes/[id]
 * 获取单个菜谱
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    // 直接调用Worker API获取单个菜谱
    const response = await fetch(getWorkerApiUrl(`/api/recipes/${id}?lang=${language}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/recipes/[id]
 * 更新菜谱 - 通过Worker API
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // 调用Worker API更新菜谱
    const response = await fetch(getWorkerApiUrl(`/api/recipes/${id}`), {
      method: 'PUT',
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recipes/[id]
 * 删除菜谱 - 通过Worker API
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // 调用Worker API删除菜谱
    const response = await fetch(getWorkerApiUrl(`/api/recipes/${id}`), {
      method: 'DELETE',
      headers: {
        'Authorization': req.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}
