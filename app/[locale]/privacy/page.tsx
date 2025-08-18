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
    title: 'Privacy Policy - Recipe Easy',
    description: 'Privacy Policy for Recipe Easy AI-powered recipe generation platform',
    path: 'privacy',
    locale,
  });
}

async function getPrivacyPolicy(locale: string) {
  try {
    // 根据语言选择对应的文件
    const fileName = locale === 'zh' ? 'privacy-policy-zh.md' : 'privacy-policy.md';

    // 使用文件系统读取文件内容
    const filePath = path.join(process.cwd(), 'public', fileName);
    const content = fs.readFileSync(filePath, 'utf8');

    // 使用remark渲染Markdown
    const processedContent = await remark()
      .use(html)
      .process(content);

    return processedContent.toString();
  } catch (error) {
    console.error('Error loading privacy policy:', error);
    
    // 如果加载失败，返回默认内容
    const defaultContent = locale === 'zh' ? 
      '<h1>隐私政策</h1><p>隐私政策加载失败，请稍后重试。</p>' :
      '<h1>Privacy Policy</h1><p>Privacy policy failed to load, please try again later.</p>';
    
    return defaultContent;
  }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = await getPrivacyPolicy(locale);

  return (
    <SimpleLayout title="Privacy Policy">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </SimpleLayout>
  );
}

// 移除 Edge Runtime 以启用静态生成
