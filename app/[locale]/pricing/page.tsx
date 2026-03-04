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
      ? "通过 PayPal 购买 RecipeEasy 积分，立即解锁菜谱与图片生成功能。"
      : "Buy RecipeEasy credit packages with PayPal and unlock recipe and image generation instantly.",
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
