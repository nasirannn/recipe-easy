import { NextRequest, NextResponse } from 'next/server';
import { submitUrlToIndexNow, submitUrlsToIndexNow, submitMainPagesToIndexNow } from '@/lib/indexnow';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, urls, type } = body;

    let success = false;

    if (type === 'main-pages') {
      // 提交主要页面
      success = await submitMainPagesToIndexNow();
    } else if (urls && Array.isArray(urls)) {
      // 批量提交 URLs
      success = await submitUrlsToIndexNow(urls);
    } else if (url) {
      // 提交单个 URL
      success = await submitUrlToIndexNow(url);
    } else {
      return NextResponse.json(
        { error: 'Missing url, urls, or type parameter' },
        { status: 400 }
      );
    }

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'URLs submitted to IndexNow successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to submit to IndexNow' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('IndexNow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET 请求用于手动触发主要页面提交
export async function GET() {
  try {
    const success = await submitMainPagesToIndexNow();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Main pages submitted to IndexNow successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to submit main pages to IndexNow' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('IndexNow GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
