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
      ? "在同一工作台中选择食材、设置偏好并生成 AI 菜谱与菜品图片，更快完成从灵感到上桌的整个流程。"
      : "Select ingredients, set preferences, and generate RecipeEasy recipes plus dish images in one workspace built for faster cooking decisions.",
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
