import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
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
    title: 'Terms of Service - Recipe Easy',
    description: 'Terms of Service for Recipe Easy AI-powered recipe generation platform',
    path: 'terms',
    locale,
  });
}

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
    <SimpleLayout title="Terms of Service">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </SimpleLayout>
  );
}
