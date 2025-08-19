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
    `<div class="prose prose-lg max-w-none">
     <h1>隐私政策</h1>
     <p class="text-sm text-gray-600 mb-6">最后更新：2024年12月19日</p>

     <p class="lead">Recipe Easy（"我们"、"我们的"或"本服务"）致力于保护您的隐私。本隐私政策详细说明了我们如何收集、使用、存储和保护您在使用我们的AI驱动食谱生成平台时提供的信息。</p>

     <h2>1. 我们收集的信息</h2>

     <h3>1.1 您直接提供的信息</h3>
     <ul>
       <li><strong>账户信息：</strong>当您注册账户时，我们收集您的姓名、电子邮件地址和密码</li>
       <li><strong>个人资料：</strong>您可以选择提供头像、饮食偏好、过敏信息等</li>
       <li><strong>食谱数据：</strong>您创建、保存或分享的食谱内容</li>
       <li><strong>反馈信息：</strong>您通过客服或反馈表单提供的信息</li>
     </ul>

     <h3>1.2 自动收集的信息</h3>
     <ul>
       <li><strong>使用数据：</strong>您如何使用我们的服务，包括访问的页面、功能使用情况</li>
       <li><strong>设备信息：</strong>设备类型、操作系统、浏览器类型和版本</li>
       <li><strong>日志信息：</strong>IP地址、访问时间、错误日志</li>
       <li><strong>Cookie和类似技术：</strong>用于改善用户体验和分析服务使用情况</li>
     </ul>

     <h2>2. 我们如何使用您的信息</h2>
     <ul>
       <li><strong>提供服务：</strong>处理您的请求，生成个性化食谱推荐</li>
       <li><strong>账户管理：</strong>创建和维护您的账户，提供客户支持</li>
       <li><strong>服务改进：</strong>分析使用模式，改进AI算法和用户体验</li>
       <li><strong>通信：</strong>发送服务相关通知、更新和营销信息（您可以选择退出）</li>
       <li><strong>安全保护：</strong>检测和防止欺诈、滥用和安全威胁</li>
       <li><strong>法律合规：</strong>遵守适用的法律法规要求</li>
     </ul>

     <h2>3. 信息共享</h2>
     <p>我们不会出售您的个人信息。我们仅在以下情况下共享您的信息：</p>
     <ul>
       <li><strong>服务提供商：</strong>与帮助我们运营服务的第三方（如云服务提供商、分析工具）</li>
       <li><strong>法律要求：</strong>应法律要求、法院命令或政府机构要求</li>
       <li><strong>业务转让：</strong>在合并、收购或资产出售的情况下</li>
       <li><strong>您的同意：</strong>在获得您明确同意的其他情况下</li>
     </ul>

     <h2>4. 数据安全</h2>
     <p>我们采用行业标准的安全措施保护您的信息：</p>
     <ul>
       <li>数据传输和存储加密</li>
       <li>访问控制和身份验证</li>
       <li>定期安全审计和漏洞评估</li>
       <li>员工安全培训和保密协议</li>
     </ul>

     <h2>5. 数据保留</h2>
     <p>我们仅在必要期间保留您的信息：</p>
     <ul>
       <li>账户信息：直到您删除账户后30天</li>
       <li>使用数据：通常保留2年用于分析和改进</li>
       <li>法律要求：根据适用法律要求的保留期限</li>
     </ul>

     <h2>6. 您的权利</h2>
     <p>根据适用的隐私法律，您享有以下权利：</p>
     <ul>
       <li><strong>访问权：</strong>请求查看我们持有的您的个人信息</li>
       <li><strong>更正权：</strong>请求更正不准确的个人信息</li>
       <li><strong>删除权：</strong>请求删除您的个人信息</li>
       <li><strong>限制处理权：</strong>在特定情况下限制我们处理您的信息</li>
       <li><strong>数据可携权：</strong>以结构化格式获取您的数据</li>
       <li><strong>反对权：</strong>反对我们处理您的信息</li>
     </ul>

     <h2>7. Cookie政策</h2>
     <p>我们使用Cookie和类似技术来：</p>
     <ul>
       <li>记住您的登录状态和偏好设置</li>
       <li>分析网站使用情况和性能</li>
       <li>提供个性化内容和广告</li>
       <li>改善安全性和防止欺诈</li>
     </ul>
     <p>您可以通过浏览器设置管理Cookie偏好。</p>

     <h2>8. 国际数据传输</h2>
     <p>您的信息可能会被传输到您所在国家/地区以外的服务器进行处理。我们确保此类传输符合适用的数据保护法律，并采取适当的保护措施。</p>

     <h2>9. 儿童隐私</h2>
     <p>我们的服务不面向13岁以下的儿童。我们不会故意收集13岁以下儿童的个人信息。如果我们发现收集了此类信息，将立即删除。</p>

     <h2>10. 隐私政策更新</h2>
     <p>我们可能会不时更新本隐私政策。重大变更将通过电子邮件或网站通知您。继续使用我们的服务即表示您接受更新后的政策。</p>

     <h2>11. 联系我们</h2>
     <p>如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：</p>
     <ul>
       <li>电子邮件：privacy@recipe-easy.com</li>
       <li>网站：https://recipe-easy.com</li>
     </ul>
     </div>` :
    `<div class="prose prose-lg max-w-none">
     <h1>Privacy Policy</h1>
     <p class="text-sm text-gray-600 mb-6">Last updated: December 19, 2024</p>

     <p class="lead">Recipe Easy ("we," "our," or "the service") is committed to protecting your privacy. This Privacy Policy explains in detail how we collect, use, store, and protect the information you provide when using our AI-powered recipe generation platform.</p>

     <h2>1. Information We Collect</h2>

     <h3>1.1 Information You Provide Directly</h3>
     <ul>
       <li><strong>Account Information:</strong> When you register for an account, we collect your name, email address, and password</li>
       <li><strong>Profile Information:</strong> You may choose to provide an avatar, dietary preferences, allergy information, etc.</li>
       <li><strong>Recipe Data:</strong> Recipe content you create, save, or share</li>
       <li><strong>Feedback Information:</strong> Information you provide through customer service or feedback forms</li>
     </ul>

     <h3>1.2 Automatically Collected Information</h3>
     <ul>
       <li><strong>Usage Data:</strong> How you use our service, including pages visited and feature usage</li>
       <li><strong>Device Information:</strong> Device type, operating system, browser type and version</li>
       <li><strong>Log Information:</strong> IP address, access times, error logs</li>
       <li><strong>Cookies and Similar Technologies:</strong> Used to improve user experience and analyze service usage</li>
     </ul>

     <h2>2. How We Use Your Information</h2>
     <ul>
       <li><strong>Provide Services:</strong> Process your requests and generate personalized recipe recommendations</li>
       <li><strong>Account Management:</strong> Create and maintain your account, provide customer support</li>
       <li><strong>Service Improvement:</strong> Analyze usage patterns to improve AI algorithms and user experience</li>
       <li><strong>Communication:</strong> Send service-related notifications, updates, and marketing information (you can opt out)</li>
       <li><strong>Security Protection:</strong> Detect and prevent fraud, abuse, and security threats</li>
       <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
     </ul>

     <h2>3. Information Sharing</h2>
     <p>We do not sell your personal information. We only share your information in the following circumstances:</p>
     <ul>
       <li><strong>Service Providers:</strong> With third parties who help us operate our service (such as cloud service providers, analytics tools)</li>
       <li><strong>Legal Requirements:</strong> When required by law, court order, or government agency request</li>
       <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale</li>
       <li><strong>Your Consent:</strong> In other circumstances with your explicit consent</li>
     </ul>

     <h2>4. Data Security</h2>
     <p>We employ industry-standard security measures to protect your information:</p>
     <ul>
       <li>Encryption of data transmission and storage</li>
       <li>Access controls and authentication</li>
       <li>Regular security audits and vulnerability assessments</li>
       <li>Employee security training and confidentiality agreements</li>
     </ul>

     <h2>5. Data Retention</h2>
     <p>We retain your information only for as long as necessary:</p>
     <ul>
       <li>Account information: Until 30 days after you delete your account</li>
       <li>Usage data: Typically retained for 2 years for analysis and improvement</li>
       <li>Legal requirements: According to applicable legal retention requirements</li>
     </ul>

     <h2>6. Your Rights</h2>
     <p>Under applicable privacy laws, you have the following rights:</p>
     <ul>
       <li><strong>Right to Access:</strong> Request to view the personal information we hold about you</li>
       <li><strong>Right to Rectification:</strong> Request correction of inaccurate personal information</li>
       <li><strong>Right to Erasure:</strong> Request deletion of your personal information</li>
       <li><strong>Right to Restrict Processing:</strong> Limit our processing of your information in specific circumstances</li>
       <li><strong>Right to Data Portability:</strong> Obtain your data in a structured format</li>
       <li><strong>Right to Object:</strong> Object to our processing of your information</li>
     </ul>

     <h2>7. Cookie Policy</h2>
     <p>We use cookies and similar technologies to:</p>
     <ul>
       <li>Remember your login status and preference settings</li>
       <li>Analyze website usage and performance</li>
       <li>Provide personalized content and advertising</li>
       <li>Improve security and prevent fraud</li>
     </ul>
     <p>You can manage cookie preferences through your browser settings.</p>

     <h2>8. International Data Transfers</h2>
     <p>Your information may be transferred to servers outside your country/region for processing. We ensure such transfers comply with applicable data protection laws and implement appropriate safeguards.</p>

     <h2>9. Children's Privacy</h2>
     <p>Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If we discover we have collected such information, we will delete it immediately.</p>

     <h2>10. Privacy Policy Updates</h2>
     <p>We may update this Privacy Policy from time to time. Significant changes will be communicated via email or website notification. Continued use of our service indicates acceptance of the updated policy.</p>

     <h2>11. Contact Us</h2>
     <p>If you have any questions about this Privacy Policy or need to exercise your rights, please contact us:</p>
     <ul>
       <li>Email: privacy@recipe-easy.com</li>
       <li>Website: https://recipe-easy.com</li>
     </ul>
     </div>`;

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
