import { Metadata } from 'next';
import { SimpleLayout } from '@/components/layout/simple-layout';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  return generateSeoMetadata({
    title: 'Privacy Policy - Recipe Easy',
    description: 'Recipe Easy隐私政策，了解我们如何保护您的隐私和数据安全。',
    path: 'privacy',
    locale,
  });
}

function processMarkdownToHtml(content: string) {
  // 简单处理markdown：转换基本markdown语法为HTML
  return content
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
    .replace(/<\/li><\/p>/g, '</li>')
    .replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/g, '<ul>$1</ul>'); // 将分散的li标签包装在ul中
}

async function getPrivacyPolicy(locale: string) {
  try {
    // 直接从 R2 存储桶获取内容
    const fileName = locale === 'en' ? 'privacy-policy.md' : 'privacy-policy-zh.md';
    const r2Url = `${process.env.R2_PUBLIC_URL || 'https://doc.recipe-easy.com'}/${fileName}`;
    
    // Fetching privacy policy from R2
    
    const response = await fetch(r2Url, {
      cache: 'force-cache',
      next: { revalidate: 3600 }, // 缓存1小时
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch privacy policy: ${response.status}`);
    }

    const content = await response.text();
    return processMarkdownToHtml(content);
  } catch (error) {
    // Error fetching privacy policy from R2
    
    // 如果 R2 获取失败，返回错误信息
    return `<div class="prose prose-lg max-w-none">
      <h1>${locale === 'zh' ? '隐私政策' : 'Privacy Policy'}</h1>
      <p>${locale === 'zh' ? '抱歉，隐私政策内容暂时无法加载。请稍后再试。' : 'Sorry, the privacy policy content is temporarily unavailable. Please try again later.'}</p>
      <p>${locale === 'zh' ? '错误详情：' : 'Error details: '}${error instanceof Error ? error.message : 'Unknown error'}</p>
     </div>`;
  }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = await getPrivacyPolicy(locale);

  return (
    <SimpleLayout title={locale === 'zh' ? '隐私政策' : 'Privacy Policy'}>
      <div 
        className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-li:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </SimpleLayout>
  );
}
