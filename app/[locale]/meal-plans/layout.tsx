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
      description: "View and manage your generated meal plans on RecipeEasy.",
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
