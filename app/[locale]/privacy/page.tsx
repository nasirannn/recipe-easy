import { Metadata } from 'next';
import { remark } from 'remark';
import html from 'remark-html';
import { SimpleLayout } from '@/components/layout/simple-layout';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  
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
    
    // 使用相对路径从public目录获取文件
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://recipe-easy.com';
    const response = await fetch(`${baseUrl}/${fileName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch privacy policy: ${response.status}`);
    }
    
    const content = await response.text();

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

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  const content = await getPrivacyPolicy(params.locale);

  return (
    <SimpleLayout title="Privacy Policy">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </SimpleLayout>
  );
}

export const runtime = 'edge';
