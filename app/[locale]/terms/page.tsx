import { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';
import { getLegalDocument, normalizeLegalLocale } from '@/lib/server/legal-documents';
import { FooterSection } from '@/components/layout/sections/footer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale.toLowerCase().startsWith('zh');
  
  return generateSeoMetadata({
    title: isZh ? '服务条款 - RecipeEasy' : 'Terms of Service - RecipeEasy',
    description: isZh
      ? '了解使用 RecipeEasy 服务时适用的条款、责任与使用规范。'
      : 'Read the terms and conditions for using RecipeEasy services.',
    path: 'terms',
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

async function getTermsOfService(locale: string) {
  const content = await getLegalDocument('terms', normalizeLegalLocale(locale));
  if (content) {
    return processMarkdownToHtml(content);
  }

  return `<div class="prose prose-lg max-w-none">
    <h1>${locale === 'zh' ? '服务条款' : 'Terms of Service'}</h1>
    <p>${locale === 'zh' ? '抱歉，服务条款内容暂时无法加载。请稍后再试。' : 'Sorry, the terms of service content is temporarily unavailable. Please try again later.'}</p>
  </div>`;
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = await getTermsOfService(locale);
  const title = locale === 'zh' ? '服务条款' : 'Terms of Service';

  return (
    <>
      <main className="mx-auto w-full max-w-4xl px-4 py-10 md:py-14">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        </div>
        <div
          className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-li:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>
      <FooterSection />
    </>
  );
}
