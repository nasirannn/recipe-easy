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
  const isZh = locale.toLowerCase().startsWith("zh");

  return generateSeoMetadata({
    title: isZh ? "RecipeEasy 工作台 - AI 菜谱生成器" : "RecipeEasy Workspace - AI Recipe Generator",
    description: isZh
      ? "在同一工作台选择食材、生成菜谱与菜品图片，快速完成从想法到出品。"
      : "Select ingredients, generate recipes and recipe images in one workspace.",
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
