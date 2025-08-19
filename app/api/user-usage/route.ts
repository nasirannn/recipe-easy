import { NextRequest, NextResponse } from 'next/server';
import { validateUserId } from '@/lib/utils/validation';

// 配置 Edge Runtime 以支持 Cloudflare Pages

// 强制动态渲染
// 启用缓存以提高性能
export const revalidate = 300; // 5分钟缓存

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    // 🔒 安全修复：严格验证用户输入
    const userValidation = validateUserId(rawUserId);
    if (!userValidation.isValid) {
      return NextResponse.json({ error: userValidation.error }, { status: 400 });
    }

    const userId = userValidation.userId!;
    const isAdmin = false; // 暂时禁用管理员功能

    // 构建查询参数
    const params = new URLSearchParams();
    params.append('userId', userId);
    if (isAdmin) params.append('isAdmin', 'true');

    // 直接调用云端数据库
    const workerUrl = process.env.WORKER_URL || 'https://api.recipe-easy.com';
    const response = await fetch(`${workerUrl}/api/user-usage?${params}`, {
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
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: bodyUserId, action, amount, description } = body;

    // 🔒 安全修复：严格验证用户输入
    const userValidation = validateUserId(bodyUserId);
    if (!userValidation.isValid) {
      return NextResponse.json({ error: userValidation.error }, { status: 400 });
    }
    
    const userId = userValidation.userId!;

    // 直接调用云端数据库
    const workerUrl = process.env.WORKER_URL || 'https://api.recipe-easy.com';
    const response = await fetch(`${workerUrl}/api/user-usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, action, amount, description }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
}
