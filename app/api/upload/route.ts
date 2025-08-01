/**
 * 文件上传API
 * 
 * 允许用户上传图片文件到服务器
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * 检查文件类型是否是图片
 */
function isImage(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.startsWith('image/');
}

/**
 * 生成唯一的文件名
 */
function generateUniqueFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const uuid = uuidv4();
  return `${uuid}${ext}`;
}

/**
 * 模拟文件存储服务
 */
class MockStorage {
  // 保存上传文件的记录
  private static uploads: Record<string, {
    url: string,
    contentType: string,
    fileName: string
  }> = {};

  // 模拟上传文件
  async upload(key: string, data: ArrayBuffer, options: { contentType: string }) {
    // 模拟存储文件
    MockStorage.uploads[key] = {
      url: `/api/images/${key}`,
      contentType: options.contentType,
      fileName: key.split('/').pop() || 'unknown'
    };
    
    return true;
  }

  // 获取文件URL
  getUrl(key: string): string {
    return `/api/images/${key}`;
  }
}

// 创建模拟存储实例
const mockStorage = new MockStorage();

/**
 * POST /api/upload
 * 上传文件
 */
export async function POST(req: NextRequest) {
  // 检查认证
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: '需要授权' }, { status: 401 });
  }
  
  // 解析表单数据
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: '没有提供文件' }, { status: 400 });
    }
    
    // 检查文件类型
    if (!isImage(file.type)) {
      return NextResponse.json({ error: '仅支持图片文件' }, { status: 400 });
    }
    
    // 限制文件大小（例如5MB）
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '文件太大，最大允许5MB' }, { status: 400 });
    }
    
    // 生成唯一文件名
    const fileName = generateUniqueFileName(file.name);
    
    // 模拟用户ID
    const userId = 'user1';
    const userFolder = `user-${userId}/`;
    const key = `uploads/${userFolder}${fileName}`;
    
    // 读取文件内容
    const fileBuffer = await file.arrayBuffer();
    
    // 上传到模拟存储
    await mockStorage.upload(key, fileBuffer, {
      contentType: file.type
    });
    
    // 获取文件URL
    const url = mockStorage.getUrl(key);
    
    // 返回文件URL
    return NextResponse.json({ url, key });
    
  } catch (error) {
    console.error('文件上传错误:', error);
    return NextResponse.json({ error: '文件上传失败' }, { status: 500 });
  }
}
