import { FooterSection } from "@/components/layout/sections/footer";
import { PayPalReturnResult } from "@/components/payments/paypal-return-result";
import { generateMetadata as generateSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isZh = locale.toLowerCase().startsWith("zh");

  return {
    ...generateSeoMetadata({
      title: isZh ? "RecipeEasy - 支付确认" : "RecipeEasy - Payment Confirmation",
      description: isZh
        ? "正在确认你的 PayPal 支付并将积分添加到 RecipeEasy 账户，以便继续生成菜谱、膳食计划和图片。"
        : "RecipeEasy is confirming your PayPal payment and applying credits to your account so you can continue generating recipes, meal plans, and images.",
      path: "/pricing/paypal-return",
      locale,
    }),
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default function PayPalReturnPage() {
  const title = "Payment confirmation";

  return (
    <main className="bg-background text-foreground">
      <section className="px-4 py-8 md:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <h1 className="sr-only">{title}</h1>
          <PayPalReturnResult />
        </div>
      </section>
      <FooterSection />
    </main>
  );
}
