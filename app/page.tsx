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
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { getHomeRecipePreviews } from "@/lib/server/home";

export async function generateMetadata() {
  return generateSeoMetadata({
    title: "RecipeEasy - AI Recipe Generator, Random Recipes, Meal Ideas",
    description: "Stuck on what to cook? Enter your ingredients and get random, AI-generated recipes based on what you have — solve your 'what can I use' problem.",
    path: "/",
  });
}

export default async function RootPage() {
  // 为根路径提供英文消息
  const messages = await getMessages({ locale: 'en' });
  const featuredRecipes = await getHomeRecipePreviews('en', 9);

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <div className="theme-shell-base">
        <div className="theme-shell-content">
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
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
