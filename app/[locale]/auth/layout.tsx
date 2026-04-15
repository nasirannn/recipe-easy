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
      title: "Sign In - RecipeEasy",
      description: "Sign in to RecipeEasy to save recipes, access your cookbook, manage meal plans, and continue generating personalized dishes and images.",
      path: "auth",
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

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
