import { FooterSection } from "@/components/layout/sections/footer";
import { WorkspaceSection } from "@/components/layout/sections/workspace";
import { generateMetadata as generateSeoMetadata } from "@/lib/seo";
import { getHomeRecipePreviews } from "@/lib/server/home";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return generateSeoMetadata({
    title: "RecipeEasy Workspace - AI Recipe Generator",
    description:
      "Select ingredients, generate recipes and recipe images in one workspace.",
    path: "/workspace",
    locale: locale === "en" ? undefined : locale,
  });
}

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const recentRecipes = await getHomeRecipePreviews(locale, 3);

  return (
    <main className="home-main">
      <WorkspaceSection initialRecentRecipes={recentRecipes} />
      <FooterSection />
    </main>
  );
}
