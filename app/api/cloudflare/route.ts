import { NextRequest, NextResponse } from 'next/server';

// 云平台环境变量
const CLOUDFLARE_API_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL || 'http://localhost:8787';

/**
 * 代理所有API请求到Cloudflare Worker
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams, pathname } = new URL(request.url);
    // 从/api/cloudflare开始提取路径
    const path = pathname.replace('/api/cloudflare', '');
    
    // 构建完整的Cloudflare Worker URL
    let workerUrl = `${CLOUDFLARE_API_URL}${path}`;
    
    // 添加任何查询参数
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    if (params.toString()) {
      workerUrl += `?${params.toString()}`;
    }
    
    // 转发请求到Cloudflare Worker
    const response = await fetch(workerUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API代理请求失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * 代理POST请求到Cloudflare Worker
 */
export async function POST(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    // 从/api/cloudflare开始提取路径
    const path = pathname.replace('/api/cloudflare', '');
    
    // 构建完整的Cloudflare Worker URL
    const workerUrl = `${CLOUDFLARE_API_URL}${path}`;
    
    // 获取请求体
    const body = await request.json();
    
    // 转发请求到Cloudflare Worker
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API代理请求失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * 代理PUT请求到Cloudflare Worker
 */
export async function PUT(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    // 从/api/cloudflare开始提取路径
    const path = pathname.replace('/api/cloudflare', '');
    
    // 构建完整的Cloudflare Worker URL
    const workerUrl = `${CLOUDFLARE_API_URL}${path}`;
    
    // 获取请求体
    const body = await request.json();
    
    // 转发请求到Cloudflare Worker
    const response = await fetch(workerUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API代理请求失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * 代理DELETE请求到Cloudflare Worker
 */
export async function DELETE(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    // 从/api/cloudflare开始提取路径
    const path = pathname.replace('/api/cloudflare', '');
    
    // 构建完整的Cloudflare Worker URL
    const workerUrl = `${CLOUDFLARE_API_URL}${path}`;
    
    // 转发请求到Cloudflare Worker
    const response = await fetch(workerUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API代理请求失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
} 