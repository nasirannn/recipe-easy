import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染
// 强制动态渲染
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    const rawIsAdmin = searchParams.get('isAdmin');

    // 🔒 安全修复：严格验证用户输入
    if (!rawUserId || typeof rawUserId !== 'string') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    // 验证用户ID格式（UUID格式）
    const userIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userIdRegex.test(rawUserId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    
    const userId = rawUserId;
    const isAdmin = rawIsAdmin === 'true';

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
    if (!bodyUserId || typeof bodyUserId !== 'string') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    // 验证用户ID格式（UUID格式）
    const userIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userIdRegex.test(bodyUserId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    
    const userId = bodyUserId;

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
