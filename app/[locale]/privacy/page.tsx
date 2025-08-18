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
    description: 'Privacy Policy for Recipe Easy AI-powered recipe generation platform',
    path: 'privacy',
    locale,
  });
}

async function getPrivacyPolicy(locale: string) {
  // 在 Edge Runtime 中，直接返回静态内容
  const defaultContent = locale === 'zh' ?
    `<h1>隐私政策</h1>
     <p>我们重视您的隐私。本隐私政策说明了我们如何收集、使用和保护您的个人信息。</p>
     <h2>信息收集</h2>
     <p>我们可能会收集您提供的个人信息，如姓名、电子邮件地址等。</p>
     <h2>信息使用</h2>
     <p>我们使用收集的信息来提供和改进我们的服务。</p>
     <h2>信息保护</h2>
     <p>我们采取适当的安全措施来保护您的个人信息。</p>
     <h2>联系我们</h2>
     <p>如果您对本隐私政策有任何疑问，请联系我们。</p>` :
    `<h1>Privacy Policy</h1>
     <p>We value your privacy. This privacy policy explains how we collect, use, and protect your personal information.</p>
     <h2>Information Collection</h2>
     <p>We may collect personal information that you provide to us, such as your name and email address.</p>
     <h2>Information Use</h2>
     <p>We use the collected information to provide and improve our services.</p>
     <h2>Information Protection</h2>
     <p>We take appropriate security measures to protect your personal information.</p>
     <h2>Contact Us</h2>
     <p>If you have any questions about this privacy policy, please contact us.</p>`;

  return defaultContent;
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

export const runtime = 'edge';
