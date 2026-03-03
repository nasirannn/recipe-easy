import { FooterSection } from "@/components/layout/sections/footer";
import { PayPalReturnResult } from "@/components/payments/paypal-return-result";
import { generateMetadata as generateSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return generateSeoMetadata({
    title: "RecipeEasy - Payment Confirmation",
    description: "Confirming your PayPal payment and crediting your RecipeEasy account.",
    path: "/pricing/paypal-return",
    locale,
  });
}

export default function PayPalReturnPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="px-4 py-8 md:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <PayPalReturnResult />
        </div>
      </section>
      <FooterSection />
    </main>
  );
}

