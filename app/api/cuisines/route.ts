import { NextRequest, NextResponse } from 'next/server';

// 菜系类型定义
interface Cuisine {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export async function GET(request: NextRequest) {
  try {
    // 尝试从 Cloudflare Workers API 获取数据
    try {
      const workerUrl = 'https://recipe-easy.annnb016.workers.dev/api/cuisines';

      const response = await fetch(workerUrl, {
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

    // 备用：使用静态数据
    const staticCuisines: Cuisine[] = [
      { id: 1, name: 'Chinese', description: 'Traditional Chinese cuisine' },
      { id: 2, name: 'Italian', description: 'Classic Italian dishes' },
      { id: 3, name: 'French', description: 'Elegant French cuisine' },
      { id: 4, name: 'Indian', description: 'Spicy and aromatic Indian dishes' },
      { id: 5, name: 'Japanese', description: 'Traditional Japanese cuisine' },
      { id: 6, name: 'Mediterranean', description: 'Healthy Mediterranean diet' },
      { id: 7, name: 'Thai', description: 'Bold Thai flavors' },
      { id: 8, name: 'Mexican', description: 'Vibrant Mexican cuisine' },
    ];

    return NextResponse.json({
      success: true,
      data: staticCuisines,
      total: staticCuisines.length,
      source: 'static'
    });

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
