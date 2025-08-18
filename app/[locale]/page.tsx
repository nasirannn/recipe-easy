import { FAQSection } from "@/components/layout/sections/faq";
import { FeaturesSection } from "@/components/layout/sections/features";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { RecipesSection } from "@/components/layout/sections/recipes";
import { TestimonialSection } from "@/components/layout/sections/testimonial";
import { TutorialSection } from "@/components/layout/sections/tutorial";
import { generateMetadata as generateSeoMetadata } from "@/lib/seo";
import { IntroductionSection } from "@/components/layout/sections/introduction";
import { AnchorHandler } from "@/components/layout/anchor-handler";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return generateSeoMetadata({
    title: "RecipeEasy - AI Recipe Generator, Random Recipes, Meal Ideas",
    description: "Stuck on what to cook? Enter your ingredients and get random, AI-generated recipes based on what you have — solve your 'what can I use' problem.",
    path: "/",
    locale,
  });
}

export default function Home() {
  return (
    <>
      <AnchorHandler />
      <HeroSection />
      <TutorialSection />
      <RecipesSection />
      <IntroductionSection />
      <FeaturesSection />
      <FAQSection />
      <TestimonialSection />
      <FooterSection />
    </>
  );
}

export const runtime = 'edge';
