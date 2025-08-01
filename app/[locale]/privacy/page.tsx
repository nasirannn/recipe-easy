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
    title: 'Privacy Policy - Recipe Easy',
    description: 'Privacy Policy for Recipe Easy AI-powered recipe generation platform',
    path: 'privacy',
    locale,
  });
}

async function getPrivacyPolicy(locale: string) {
  const fileName = locale === 'zh' ? 'privacy-policy-zh.md' : 'privacy-policy.md';
  const filePath = path.join(process.cwd(), 'public', fileName);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  const processedContent = await remark()
    .use(html)
    .process(fileContents);

  return processedContent.toString();
}

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  const content = await getPrivacyPolicy(params.locale);

  return (
    <SimpleLayout title="Privacy Policy">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </SimpleLayout>
  );
}
