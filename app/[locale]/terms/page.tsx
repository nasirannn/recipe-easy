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
    title: 'Terms of Service - Recipe Easy',
    description: 'Terms of Service for Recipe Easy AI-powered recipe generation platform',
    path: 'terms',
    locale,
  });
}

async function getTermsOfService(locale: string) {
  // 在 Edge Runtime 中，直接返回静态内容
  const defaultContent = locale === 'zh' ?
    `<h1>服务条款</h1>
     <p>欢迎使用我们的服务。通过使用我们的服务，您同意遵守以下条款和条件。</p>
     <h2>服务使用</h2>
     <p>您可以使用我们的服务来生成和浏览食谱。请合理使用我们的服务。</p>
     <h2>用户责任</h2>
     <p>您有责任确保您提供的信息准确无误，并遵守适用的法律法规。</p>
     <h2>服务变更</h2>
     <p>我们保留随时修改或终止服务的权利，恕不另行通知。</p>
     <h2>免责声明</h2>
     <p>我们的服务按"现状"提供，不提供任何明示或暗示的保证。</p>
     <h2>联系我们</h2>
     <p>如果您对这些条款有任何疑问，请联系我们。</p>` :
    `<h1>Terms of Service</h1>
     <p>Welcome to our service. By using our service, you agree to comply with the following terms and conditions.</p>
     <h2>Service Usage</h2>
     <p>You may use our service to generate and browse recipes. Please use our service reasonably.</p>
     <h2>User Responsibilities</h2>
     <p>You are responsible for ensuring that the information you provide is accurate and that you comply with applicable laws and regulations.</p>
     <h2>Service Changes</h2>
     <p>We reserve the right to modify or terminate the service at any time without notice.</p>
     <h2>Disclaimer</h2>
     <p>Our service is provided "as is" without any express or implied warranties.</p>
     <h2>Contact Us</h2>
     <p>If you have any questions about these terms, please contact us.</p>`;

  return defaultContent;
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = await getTermsOfService(locale);

  return (
    <SimpleLayout title="Terms of Service">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </SimpleLayout>
  );
}

export const runtime = 'edge';
