import { Metadata } from 'next';
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
    description: 'Recipe Easy服务条款，了解使用我们服务的条款和条件。',
    path: 'terms',
    locale,
  });
}

async function getTermsOfService(locale: string) {
  try {
    // 直接从文件系统读取markdown文件
    const fileName = locale === 'zh' ? 'terms-of-service-zh.md' : 'terms-of-service.md';
    const filePath = path.join(process.cwd(), 'public', fileName);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${fileName}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
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
    const withLists = cleanContent.replace(/(<li>.*?<\/li>)/g, (match) => {
      return match;
    }).replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/g, '<ul>$1</ul>');
    
    return withLists;
  } catch (error) {
    console.error('Error reading terms of service file:', error);
    // 如果读取文件失败，返回错误信息
    return `<div class="prose prose-lg max-w-none">
      <h1>服务条款</h1>
      <p>抱歉，服务条款内容暂时无法加载。请稍后再试。</p>
    </div>`;
  }
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = await getTermsOfService(locale);

  return (
    <SimpleLayout title="Terms of Service">
      <div 
        className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-li:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </SimpleLayout>
  );
}
