/**
 * 保存菜谱API路由
 * 
 * 处理菜谱保存到Worker数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWorkerApiUrl } from '@/lib/config';
import { submitUrlToIndexNow } from '@/lib/indexnow';

// 强制动态渲染
export const runtime = 'edge';

/**
 * POST /api/recipes/save
 * 保存菜谱到Worker数据库
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 调用Worker API保存菜谱
    const response = await fetch(getWorkerApiUrl('/api/recipes/save'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to save recipe' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();

    // 如果保存成功且有食谱ID，提交到 IndexNow
    if (data.success && data.recipe?.id) {
      try {
        const recipeUrl = `/recipe/${data.recipe.id}`;
        await submitUrlToIndexNow(recipeUrl);
        console.log(`📡 IndexNow submitted for recipe: ${recipeUrl}`);
      } catch (indexError) {
        // IndexNow 失败不影响主要功能
        console.warn('IndexNow submission failed:', indexError);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save recipe' },
      { status: 500 }
    );
  }
} 