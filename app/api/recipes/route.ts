import { NextRequest, NextResponse } from 'next/server';

// Cloudflare D1 类型定义
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
  }
  
  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first(): Promise<any>;
    all(): Promise<{ results: any[] }>;
  }
}

// 获取 Cloudflare D1 数据库实例
function getDatabase(): D1Database | null {
  // 在开发环境中，我们暂时返回 null，使用备用数据
  // 在生产环境中，这将通过 Cloudflare Workers 环境提供
  if (typeof globalThis !== 'undefined' && (globalThis as any).DB) {
    return (globalThis as any).DB;
  }
  
  return null;
}

// 备用静态数据（当数据库不可用时使用）
const recipes: any[] = [
  // 静态数据已移除，现在完全依赖数据库
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const tag = searchParams.get('tag')
    const difficulty = searchParams.get('difficulty')
    const language = searchParams.get('lang') || 'en'

    // 尝试从 Cloudflare Workers API 获取数据
    try {
      const workerUrl = new URL('https://recipe-easy.annnb016.workers.dev/api/recipes');
      workerUrl.searchParams.set('limit', limit.toString());
      workerUrl.searchParams.set('offset', offset.toString());
      workerUrl.searchParams.set('lang', language);
      if (tag) workerUrl.searchParams.set('tag', tag);
      if (difficulty) workerUrl.searchParams.set('difficulty', difficulty);

      const response = await fetch(workerUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // 禁用缓存
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return NextResponse.json(data);
        }
      }
      
      console.log('Workers API failed, falling back to static data');
    } catch (workerError) {
      console.error('Workers API error, falling back to static data:', workerError);
    }

    // 备用：使用静态数据（现在为空）
    let filteredRecipes = [...recipes]

    // 按标签过滤
    if (tag) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.tags && recipe.tags.some((t: string) => t.toLowerCase().includes(tag.toLowerCase()))
      )
    }

    // 按难度过滤
    if (difficulty) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.difficulty?.toLowerCase() === difficulty.toLowerCase()
      )
    }

    // 分页
    const paginatedRecipes = filteredRecipes.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedRecipes,
      total: filteredRecipes.length,
      limit,
      offset,
      source: 'static'
    })

  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recipes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
