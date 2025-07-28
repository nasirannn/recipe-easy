import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';

export const metadata: Metadata = {
  title: 'Terms of Service - Recipe Easy',
  description: 'Terms of Service for Recipe Easy AI-powered recipe generation platform',
};

async function getTermsOfService(locale: string) {
  const fileName = locale === 'zh' ? 'terms-of-service-zh.md' : 'terms-of-service.md';
  const filePath = path.join(process.cwd(), 'public', fileName);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  const processedContent = await remark()
    .use(html)
    .process(fileContents);

  return processedContent.toString();
}

export default async function TermsPage({ params }: { params: { locale: string } }) {
  const content = await getTermsOfService(params.locale);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div
        className="prose prose-lg max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
