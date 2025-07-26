import { FAQSection } from "@/components/layout/sections/faq";
import { FeaturesSection } from "@/components/layout/sections/features";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { RecipesSection } from "@/components/layout/sections/recipes";
import { TestimonialSection } from "@/components/layout/sections/testimonial";
import { ServicesSection } from "@/components/layout/sections/services";

export const metadata = {
  title: "RecipeEasy - AI Recipe Generator, Random Recipes, Meal Ideas",
  description: "Stuck on what to cook? Enter your ingredients and get random, AI-generated recipes based on what you have — with easy cooking steps.",
  openGraph: {
    type: "website",
    url: "",
    title: "recipe-easy - Landing template",
    description: "AI Recipe Generator, Random Recipes, Meal Ideas",
    images: [
      {
        url: "https://res.cloudinary.com/dbzv9xfjp/image/upload/v1723499276/og-images/shadcn-vue.jpg",
        width: 1200,
        height: 630,
        alt: "Shadcn - Landing template",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "https://github.com/nobruf/shadcn-landing-page.git",
    title: "Shadcn - Landing template",
    description: "Free Shadcn landing page for developers",
    images: [
      "https://res.cloudinary.com/dbzv9xfjp/image/upload/v1723499276/og-images/shadcn-vue.jpg",
    ],
  },
};

export default function Home() {
  return (
    <>
      <FeaturesSection />
      <HeroSection />
      <RecipesSection />
      <ServicesSection />
      <TestimonialSection />
      <FAQSection />
      <FooterSection />
    </>
  );
}
