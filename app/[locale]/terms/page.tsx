import { Metadata } from 'next';
import { remark } from 'remark';
import html from 'remark-html';
import { SimpleLayout } from '@/components/layout/simple-layout';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';
import fs from 'fs';
import path from 'path';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  return generateSeoMetadata({
    title: 'Terms of Service - Recipe Easy',
    description: 'Terms of Service for Recipe Easy AI-powered recipe generation platform',
    path: 'terms',
    locale,
  });
}

async function getTermsOfService(locale: string) {
  try {
    // 根据语言选择对应的文件
    const fileName = locale === 'zh' ? 'terms-of-service-zh.md' : 'terms-of-service.md';

    // 使用文件系统读取文件内容
    const filePath = path.join(process.cwd(), 'public', fileName);
    const content = fs.readFileSync(filePath, 'utf8');

    // 使用remark渲染Markdown
    const processedContent = await remark()
      .use(html)
      .process(content);

    return processedContent.toString();
  } catch (error) {
    console.error('Error loading terms of service:', error);

    // 如果加载失败，返回默认内容
    const defaultContent = locale === 'zh' ?
      '<h1>服务条款</h1><p>服务条款加载失败，请稍后重试。</p>' :
      '<h1>Terms of Service</h1><p>Terms of service failed to load, please try again later.</p>';

    return defaultContent;
  }
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = await getTermsOfService(locale);

  return (
    <SimpleLayout title="Terms of Service">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </SimpleLayout>
  );
}

// 移除 Edge Runtime 以启用静态生成
