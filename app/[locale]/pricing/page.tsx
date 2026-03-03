import { FooterSection } from "@/components/layout/sections/footer";
import { CreditPackagesSection } from "@/components/payments/credit-packages-section";
import { generateMetadata as generateSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return generateSeoMetadata({
    title: "RecipeEasy Credits - Buy PayPal Credit Packages",
    description: "Buy RecipeEasy credit packages with PayPal and unlock recipe and image generation instantly.",
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
