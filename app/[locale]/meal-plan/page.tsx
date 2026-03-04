import { FooterSection } from "@/components/layout/sections/footer";
import { MealPlanSection } from "@/components/layout/sections/meal-plan";
import { generateMetadata as generateSeoMetadata, SITE_URL } from "@/lib/seo";

function getMealPlanSeoCopy(locale: string) {
  const isZh = locale.toLowerCase().startsWith("zh");
  return {
    title: isZh ? "AI 膳食计划生成器 - RecipeEasy" : "Meal Plan Generator - RecipeEasy",
    description: isZh
      ? "输入饮食目标、忌口和预算，快速生成包含早餐、午餐、晚餐与加餐的个性化膳食计划。"
      : "Describe your diet goals and generate a structured meal plan with breakfast, lunch, dinner, and snack.",
  };
}

function buildMealPlanStructuredData({
  locale,
  title,
  description,
}: {
  locale: string;
  title: string;
  description: string;
}) {
  const isZh = locale.toLowerCase().startsWith("zh");
  const baseUrl = SITE_URL.replace(/\/+$/, "");
  const pageUrl = isZh ? `${baseUrl}/zh/meal-plan` : `${baseUrl}/meal-plan`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: pageUrl,
    inLanguage: isZh ? "zh-CN" : "en-US",
    isPartOf: {
      "@type": "WebSite",
      name: "RecipeEasy",
      url: baseUrl,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { title, description } = getMealPlanSeoCopy(locale);

  return generateSeoMetadata({
    title,
    description,
    path: "/meal-plan",
    locale: locale === "en" ? undefined : locale,
  });
}

export default async function MealPlanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { title, description } = getMealPlanSeoCopy(locale);
  const structuredData = buildMealPlanStructuredData({
    locale,
    title,
    description,
  });

  return (
    <main className="home-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MealPlanSection />
      <FooterSection />
    </main>
  );
}
