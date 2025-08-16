import { NextRequest, NextResponse } from 'next/server';
import { getWorkerApiUrl } from '@/lib/config';

// 启用缓存以提高性能
export const revalidate = 3600; // 1小时缓存

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';

    // 直接调用云端数据库 - 与categories API保持一致的URL构建方式
    const response = await fetch(getWorkerApiUrl(`/api/cuisines?lang=${language}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // 修复数据结构：将data字段转换为results字段以匹配前端期望（与categories API一致）
    if (data.success && data.data) {
      return NextResponse.json({
        ...data,
        results: data.data
      });
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ 获取菜系数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取菜系数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
