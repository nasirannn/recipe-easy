import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// R2 存储桶配置
const R2_CONFIG = {
  bucketName: 'recipe-doc',
  baseUrl: process.env.R2_PUBLIC_URL || 'https://pub-f394e3ee820f4d8ea8a5e4c343502b6c.r2.dev',
  customDomain: 'https://doc.recipe-easy.com',
};

// 获取文档的完整 URL
function getDocumentUrl(type: string, locale: string): string {
  // 修复文件名格式以匹配实际文件
  let fileName: string;
  if (type === 'privacy') {
    fileName = locale === 'en' ? 'privacy-policy.md' : 'privacy-policy-zh.md';
  } else if (type === 'terms') {
    fileName = locale === 'en' ? 'terms-of-service.md' : 'terms-of-service-zh.md';
  } else {
    fileName = `${type}-policy-${locale}.md`;
  }
  
  // 优先使用自定义域名
  if (R2_CONFIG.customDomain) {
    return `${R2_CONFIG.customDomain}/${fileName}`;
  }
  
  // 使用 R2 公共 URL
  return `${R2_CONFIG.baseUrl}/${fileName}`;
}

// 从 R2 获取法律文档
async function getLegalDocumentFromR2(type: string, locale: string): Promise<string | null> {
  try {
    const url = getDocumentUrl(type, locale);
    
    // 从 R2 获取文档
    
    const response = await fetch(url, {
      cache: 'force-cache',
      next: { revalidate: 3600 }, // 缓存1小时
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    // 检查 R2 响应状态

    if (!response.ok) {
      const errorText = await response.text();
      // R2 获取失败
      throw new Error(`R2 fetch failed: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    // R2 内容获取成功
    return content;
  } catch (error) {
    // 从 R2 获取失败
    return null;
  }
}

// 从本地文件系统获取内容作为备用
async function getLegalDocumentFromLocal(type: string, locale: string): Promise<string | null> {
  try {
    // 修复文件名格式以匹配实际文件
    let fileName: string;
    if (type === 'privacy') {
      fileName = locale === 'en' ? 'privacy-policy.md' : 'privacy-policy-zh.md';
    } else if (type === 'terms') {
      fileName = locale === 'en' ? 'terms-of-service.md' : 'terms-of-service-zh.md';
    } else {
      fileName = `${type}-policy-${locale}.md`;
    }
    
    const filePath = path.join(process.cwd(), 'public', fileName);
    
    // 从本地文件读取文档
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
      // 文件存在
    } catch (accessError) {
      // 文件访问错误
      return null;
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    // 文件读取成功
    return content;
  } catch (error) {
    // 本地文件读取失败
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; locale: string } }
) {
  try {
    const { type, locale } = params;
    
    // 验证参数
    if (!['terms', 'privacy'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }
    
    if (!['en', 'zh'].includes(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    // 首先尝试从 R2 获取内容
    let content = await getLegalDocumentFromR2(type, locale);
    
    // 如果 R2 失败，从本地文件系统获取
    if (!content) {
      // R2 获取失败，尝试本地文件
      content = await getLegalDocumentFromLocal(type, locale);
    }
    
    if (!content) {
      return NextResponse.json(
        { error: 'Document not found in R2 or local files' },
        { status: 404 }
      );
    }

    // 返回 Markdown 内容
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    // Legal document API 错误
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 