import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerRouteClient } from '../../../lib/supabase-server';

// 强制动态渲染
// 启用缓存以提高性能
export const revalidate = 3600; // 1小时缓存

// 检查用户是否为管理员
async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const supabase = createSupabaseServerRouteClient();
    
    // 从Authorization头获取令牌
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) return false;
    
    return data.user.user_metadata?.role === 'admin';
  } catch (error) {
    console.error('检查管理员权限失败:', error);
    return false;
  }
}

// 获取系统配置
export async function GET(request: NextRequest) {
  try {
    // 权限检查
    if (!await isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: 需要管理员权限' },
        { status: 403 }
      );
    }

    // 调用Worker API获取配置
    const workerUrl = process.env.WORKER_URL;
    if (!workerUrl) {
      return NextResponse.json(
        { error: 'Worker URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${workerUrl}/api/system-configs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '获取系统配置失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting system configs:', error);
    return NextResponse.json(
      { error: '获取系统配置失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 更新系统配置
export async function POST(request: NextRequest) {
  try {
    // 权限检查
    if (!await isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: 需要管理员权限' },
        { status: 403 }
      );
    }

    const { key, value, description } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: '参数错误: 必须提供 key 和 value' },
        { status: 400 }
      );
    }

    // 调用Worker API更新配置
    const workerUrl = process.env.WORKER_URL;
    if (!workerUrl) {
      return NextResponse.json(
        { error: 'Worker URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${workerUrl}/api/system-configs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value, description }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '更新系统配置失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating system config:', error);
    return NextResponse.json(
      { error: '更新系统配置失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 