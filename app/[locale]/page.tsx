import { FAQSection } from "@/components/layout/sections/faq";
import { FeaturesSection } from "@/components/layout/sections/features";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { IntroductionSection } from "@/components/layout/sections/introduction";
import { RecipesSection } from "@/components/layout/sections/recipes";
import { TestimonialSection } from "@/components/layout/sections/testimonial";
import { TutorialSection } from "@/components/layout/sections/tutorial";
import { generateMetadata as generateSeoMetadata } from "@/lib/seo";
import { AnchorHandler } from "@/components/layout/anchor-handler";
import { getHomeRecipePreviews } from "@/lib/server/home";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isZh = locale.toLowerCase().startsWith("zh");

  return generateSeoMetadata({
    title: isZh
      ? "RecipeEasy - AI 菜谱生成器，随机菜谱与做饭灵感"
      : "RecipeEasy - AI Recipe Generator, Random Recipes, Meal Ideas",
    description: isZh
      ? "不知道今天做什么？输入现有食材，快速获得 AI 生成的随机菜谱和可执行做法。"
      : "Stuck on what to cook? Enter your ingredients and get random, AI-generated recipes based on what you have — solve your 'what can I use' problem.",
    path: "/",
    locale: locale === 'en' ? undefined : locale, // 英文页面不传递locale，确保canonical指向根路径
  });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const featuredRecipes = await getHomeRecipePreviews(locale, 9);

  return (
    <main className="home-main">
      <AnchorHandler />
      <HeroSection />
      <div className="home-sections">
        <TutorialSection />
        <RecipesSection recipes={featuredRecipes} />
        <IntroductionSection />
        <FeaturesSection />
        <FAQSection />
        <TestimonialSection />
        <FooterSection />
      </div>
    </main>
  );
}
