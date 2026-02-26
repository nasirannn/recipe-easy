import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const R2_PUBLIC_BASE = (
  process.env.R2_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  'https://cdn.recipe-easy.com'
).replace(/\/+$/, '');

function resolveLegalFileName(type: string, locale: string): string {
  if (type === 'privacy') {
    return locale === 'en' ? 'privacy-policy.md' : 'privacy-policy-zh.md';
  }

  if (type === 'terms') {
    return locale === 'en' ? 'terms-of-service.md' : 'terms-of-service-zh.md';
  }

  return `${type}-policy-${locale}.md`;
}

// 获取文档的完整 URL
function getDocumentUrl(type: string, locale: string): string {
  return `${R2_PUBLIC_BASE}/${resolveLegalFileName(type, locale)}`;
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
    const fileName = resolveLegalFileName(type, locale);

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
  { params }: { params: Promise<{ type: string; locale: string }> }
) {
  try {
    const { type, locale } = await params;
    
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
