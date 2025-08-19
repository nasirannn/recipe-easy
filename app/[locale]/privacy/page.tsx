import { Metadata } from 'next';
import { SimpleLayout } from '@/components/layout/simple-layout';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  return generateSeoMetadata({
    title: 'Privacy Policy - Recipe Easy',
    description: 'Recipe Easy隐私政策，了解我们如何收集、使用和保护您的个人信息。',
    path: 'privacy',
    locale,
  });
}

async function getPrivacyPolicy(locale: string) {
  try {
    // 通过fetch获取markdown文件内容
    const fileName = locale === 'zh' ? 'privacy-policy-zh.md' : 'privacy-policy.md';
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${fileName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const content = await response.text();
    
    // 简单处理markdown：移除front matter，转换基本markdown语法
    const cleanContent = content
      .replace(/^---[\s\S]*?---\n/, '') // 移除front matter
      .replace(/^# (.+)$/gm, '<h1>$1</h1>') // 转换标题
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // 转换粗体
      .replace(/\*(.+?)\*/g, '<em>$1</em>') // 转换斜体
      .replace(/^- (.+)$/gm, '<li>$1</li>') // 转换列表项
      .replace(/\n\n/g, '</p><p>') // 转换段落
      .replace(/^(.+)$/gm, '<p>$1</p>') // 包装段落
      .replace(/<p><h/g, '<h') // 清理标题
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
      .replace(/<p><li>/g, '<li>')
      .replace(/<\/li><\/p>/g, '</li>');
    
    // 将分散的li标签包装在ul中
    const withLists = cleanContent.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/g, '<ul>$1</ul>');
    
    return withLists;
  } catch (error) {
    console.error('Error reading privacy policy file:', error);
    // 如果读取文件失败，返回错误信息
    return `<div class="prose prose-lg max-w-none">
      <h1>隐私政策</h1>
      <p>抱歉，隐私政策内容暂时无法加载。请稍后再试。</p>
    </div>`;
  }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = await getPrivacyPolicy(locale);

  return (
    <SimpleLayout title="Privacy Policy">
      <div 
        className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-li:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </SimpleLayout>
  );
}
