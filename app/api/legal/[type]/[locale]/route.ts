import { NextRequest, NextResponse } from 'next/server';
import {
  getLegalDocument,
  isLegalDocumentType,
  isLegalLocale,
} from '@/lib/server/legal-documents';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; locale: string }> }
) {
  try {
    const { type, locale } = await params;
    
    // 验证参数
    if (!isLegalDocumentType(type)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }
    
    if (!isLegalLocale(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    const content = await getLegalDocument(type, locale);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Document not found in R2' },
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
