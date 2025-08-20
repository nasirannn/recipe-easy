import { NextRequest, NextResponse } from 'next/server';
import { getR2Bucket } from '@/lib/utils/database-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const imagePath = path.join('/');
    
    if (!imagePath) {
      return NextResponse.json(
        { error: 'Image path is required' },
        { status: 400 }
      );
    }

    // 获取 R2 存储桶
    const bucket = getR2Bucket();
    if (!bucket) {
      return NextResponse.json(
        { error: 'R2 bucket not available' },
        { status: 500 }
      );
    }

    // 从 R2 获取图片
    const imageObject = await bucket.get(imagePath);
    
    if (!imageObject) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // 获取图片的 Content-Type
    const contentType = imageObject.httpMetadata?.contentType || 'image/jpeg';
    
    // 将图片数据转换为 ArrayBuffer
    const imageData = await imageObject.arrayBuffer();

    // 返回图片响应
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // 缓存1年
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}

// 支持 OPTIONS 请求用于 CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 