import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';

export const metadata: Metadata = {
  title: 'Privacy Policy - Recipe Easy',
  description: 'Privacy Policy for Recipe Easy AI-powered recipe generation platform',
};

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div
        className="prose prose-lg max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
