import { FooterSection } from "@/components/layout/sections/footer";
import { CreditPackagesSection } from "@/components/payments/credit-packages-section";
import { generateMetadata as generateSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isZh = locale.toLowerCase().startsWith("zh");

  return generateSeoMetadata({
    title: isZh
      ? "RecipeEasy 积分充值 - 购买 PayPal 积分包"
      : "RecipeEasy Credits - Buy PayPal Credit Packages",
    description: isZh
      ? "通过 PayPal 购买 RecipeEasy 积分包，快速解锁 AI 菜谱生成、膳食计划和菜品图片生成功能，支付流程简单透明。"
      : "Compare RecipeEasy credit packages, pay securely with PayPal, and unlock recipe generation, meal plans, and dish image creation in one place.",
    path: "/pricing",
    locale,
  });
}

export default function PricingPage() {
  return (
    <main className="bg-background text-foreground">
      <CreditPackagesSection />
      <FooterSection />
    </main>
  );
}
