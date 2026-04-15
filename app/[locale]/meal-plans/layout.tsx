import type { Metadata } from "next";
import { generateMetadata as generateSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    ...generateSeoMetadata({
      title: "My Meal Plans - RecipeEasy",
      description: "Review, revisit, and manage your saved RecipeEasy meal plans, prompts, and weekly ideas in one organized library.",
      path: "meal-plans",
      locale: locale === "en" ? undefined : locale,
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

export default function MealPlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
