"use client";
import { useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { 
  Check,
  ChevronRight,
  ChefHat,
  Clock, 
  Copy, 
  Leaf,
  Lightbulb,
  ListOrdered,
  type LucideIcon,
  Share2,
  Sparkles,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Recipe } from '@/lib/types';
import { getImageUrl } from '@/lib/config';
import { cn } from '@/lib/utils';

interface RecipeDetailProps {
  recipe: Recipe;
  locale: string;
}



export const RecipeDetail = ({ recipe, locale }: RecipeDetailProps) => {
  const t = useTranslations('recipeDisplay');
  const [copiedSection, setCopiedSection] = useState<
    'ingredients' | 'seasoning' | 'instructions' | 'full' | 'link' | null
  >(null);
  const searchParams = useSearchParams();
  const isZh = locale.toLowerCase().startsWith('zh');
  const isFromMyRecipes = searchParams.get('source') === 'my-recipes';

  // 解析JSON字符串为数组
  const parseJsonArray = (data: unknown): string[] => {
    if (Array.isArray(data)) {
      return data.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed)
          ? parsed.map((item) => String(item).trim()).filter(Boolean)
          : [];
      } catch {
        // Failed to parse JSON
        return [];
      }
    }

    return [];
  };

  // 解析数据
  const ingredients = parseJsonArray(recipe.ingredients);
  const seasoning = parseJsonArray(recipe.seasoning);
  const instructions = parseJsonArray(recipe.instructions);
  const chefTips = parseJsonArray(recipe.chefTips);
  const tags = parseJsonArray(recipe.tags);

  const copyToClipboard = async (
    text: string,
    type: 'ingredients' | 'seasoning' | 'instructions' | 'full' | 'link'
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(type);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      // Failed to copy text
    }
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: currentUrl,
        });
        return;
      } catch (err) {
        // User dismissed share dialog
      }
    }

    // Fallback: copy URL to clipboard
    await copyToClipboard(currentUrl, 'link');
  };

  const getDifficultyLabel = (difficulty: string) => {
    // 如果是中文难度等级，直接返回
    if (difficulty === '简单' || difficulty === '中等' || difficulty === '困难') {
      return difficulty;
    }
    // 如果是英文难度等级，根据语言返回对应翻译
    switch (difficulty.toLowerCase()) {
      case 'easy': return isZh ? '简单' : 'Easy';
      case 'medium': return isZh ? '中等' : 'Medium';
      case 'hard': return isZh ? '困难' : 'Hard';
      default: return difficulty;
    }
  };

  const statItems: Array<{
    id: 'cook' | 'serves' | 'difficulty';
    icon: LucideIcon;
    label: string;
    value: string;
  }> = [];

  if (recipe.cookingTime) {
    statItems.push({
      id: 'cook',
      icon: Clock,
      label: t('cookTime'),
      value: `${recipe.cookingTime} ${t('mins')}`,
    });
  }

  if (recipe.servings) {
    statItems.push({
      id: 'serves',
      icon: Users,
      label: t('serves'),
      value: String(recipe.servings),
    });
  }

  if (recipe.difficulty) {
    statItems.push({
      id: 'difficulty',
      icon: ChefHat,
      label: t('difficulty'),
      value: getDifficultyLabel(recipe.difficulty),
    });
  }

  const handleCopyFullRecipe = async () => {
    const allContent = [
      recipe.title,
      recipe.description ? `\n${recipe.description}` : '',
      ingredients.length > 0 ? `\n${t('ingredients')}:\n${ingredients.map((ingredient) => `• ${ingredient}`).join('\n')}` : '',
      seasoning.length > 0 ? `\n${t('seasoning')}:\n${seasoning.map((season) => `• ${season}`).join('\n')}` : '',
      instructions.length > 0 ? `\n${t('instructions')}:\n${instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}` : '',
      chefTips.length > 0 ? `\n${t('chefTips')}:\n${chefTips.map((tip) => `• ${tip}`).join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    await copyToClipboard(allContent, 'full');
  };

  const breadcrumbLabels = isZh
    ? {
        home: '首页',
        recipes: '菜谱',
        myRecipes: '我的菜谱',
        navLabel: '面包屑导航',
      }
    : {
        home: 'Home',
        recipes: 'Recipes',
        myRecipes: 'My Recipes',
        navLabel: 'Breadcrumb',
      };
  const secondLevelBreadcrumb = isFromMyRecipes
    ? {
        href: `/${locale}/my-recipes`,
        label: breadcrumbLabels.myRecipes,
      }
    : {
        href: `/${locale}/recipes`,
        label: breadcrumbLabels.recipes,
      };

  const renderBasicInfo = (variant: 'cover' | 'card') => {
    const isCover = variant === 'cover';

    return (
      <>
        <h1
          className={cn(
            "text-balance text-3xl font-bold leading-[1.15] tracking-tight md:text-4xl lg:text-5xl",
            isCover
              ? "text-white drop-shadow-[0_1px_2px_rgba(2,6,23,0.75)]"
              : "text-foreground"
          )}
        >
          {recipe.title}
        </h1>

        {recipe.description && (
          <p
            className={cn(
              "mt-4 max-w-3xl leading-relaxed",
              isCover
                ? "text-sm text-white/90 drop-shadow-[0_1px_1px_rgba(2,6,23,0.7)] sm:text-base"
                : "text-base text-muted-foreground md:text-lg"
            )}
          >
            {recipe.description}
          </p>
        )}

        {statItems.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {statItems.map(({ id, icon: Icon, label, value }) => (
              <div
                key={id}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-2.5 py-1.5",
                  isCover
                    ? "border border-primary/45 bg-linear-to-r from-primary/45 to-primary/30 shadow-[0_12px_28px_rgba(2,6,23,0.42)] backdrop-blur-md ring-1 ring-primary/35"
                    : "border border-border/80 bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full",
                    isCover
                      ? "bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.24)]"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-3 w-3" />
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-none",
                    isCover
                      ? "text-primary-foreground/80 uppercase tracking-[0.08em]"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold leading-none",
                    isCover ? "text-white" : "text-foreground"
                  )}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium leading-none",
                  isCover
                    ? "border border-primary/45 bg-primary/28 text-primary-foreground shadow-[0_8px_20px_rgba(2,6,23,0.34)] backdrop-blur-md ring-1 ring-primary/30"
                    : "border border-border/80 bg-muted/60 text-muted-foreground"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 top-6 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-orange-300/15 blur-3xl dark:bg-orange-500/20" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-6">
        <section className="mb-6">
          <nav
            aria-label={breadcrumbLabels.navLabel}
            className="min-w-0 overflow-x-auto"
          >
            <ol className="flex min-w-max items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}`}
                  className="rounded-sm px-1 py-0.5 transition-colors hover:text-foreground"
                >
                  {breadcrumbLabels.home}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                <Link
                  href={secondLevelBreadcrumb.href}
                  className="rounded-sm px-1 py-0.5 transition-colors hover:text-foreground"
                >
                  {secondLevelBreadcrumb.label}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li
                className="max-w-[16rem] truncate px-1 py-0.5 font-medium text-foreground sm:max-w-[26rem]"
                aria-current="page"
              >
                {recipe.title}
              </li>
            </ol>
          </nav>
        </section>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
          {/* 右侧：快速信息与操作 */}
          <div className="order-1 h-fit lg:order-2">
            <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {t('quickInfo')}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {isZh ? '查看关键信息，快速复制或分享当前菜谱。' : 'Key details plus quick actions to copy or share this recipe.'}
                </p>

                <div className="mt-5 space-y-3">
                  {statItems.map(({ id, icon: Icon, label, value }) => (
                    <div
                      key={id}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/35 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4 text-primary/90" />
                        <span className="text-sm">{label}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-5" />

                <div className="space-y-3">
                  <Button className="h-11 w-full" onClick={handleCopyFullRecipe}>
                    {copiedSection === 'full' ? (
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copiedSection === 'full'
                      ? (isZh ? '已复制' : 'Copied')
                      : t('copyFullRecipe')}
                  </Button>

                  <Button
                    variant="outline"
                    className="h-11 w-full"
                    onClick={handleShare}
                  >
                    {copiedSection === 'link' ? (
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                    ) : (
                      <Share2 className="mr-2 h-4 w-4" />
                    )}
                    {copiedSection === 'link'
                      ? (isZh ? '链接已复制' : 'Link copied')
                      : (isZh ? '分享菜谱' : 'Share Recipe')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 左侧：主体内容 */}
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-2">
            {/* 主图片 */}
            {recipe.imagePath ? (
              <Card className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md">
                <div className="relative aspect-[4/3] bg-slate-900">
                  <Image
                    src={getImageUrl(recipe.imagePath)}
                    alt={recipe.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 52vw"
                    className="object-cover"
                    priority
                    unoptimized={true}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-900/45 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                    {renderBasicInfo('cover')}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-md">
                <CardContent className="p-6 sm:p-7">
                  {renderBasicInfo('card')}
                </CardContent>
              </Card>
            )}

            {/* 食材和调料 */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* 食材 */}
              {ingredients.length > 0 && (
                <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                        <Leaf className="h-5 w-5 text-primary" />
                        {t('ingredients')}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => copyToClipboard(ingredients.map((item) => `• ${item}`).join('\n'), 'ingredients')}
                      >
                        {copiedSection === 'ingredients' ? (
                          <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {copiedSection === 'ingredients' ? (isZh ? '已复制' : 'Copied') : (isZh ? '复制' : 'Copy')}
                      </Button>
                    </div>

                    <ul className="space-y-2.5">
                      {ingredients?.map((ingredient, i) => (
                        <li key={i} className="flex items-start gap-3 text-foreground">
                          <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                          <span className="text-sm leading-6 sm:text-base">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 调料 */}
              {seasoning.length > 0 && (
                <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                        <Sparkles className="h-5 w-5 text-secondary" />
                        {t('seasoning')}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => copyToClipboard(seasoning.map((item) => `• ${item}`).join('\n'), 'seasoning')}
                      >
                        {copiedSection === 'seasoning' ? (
                          <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {copiedSection === 'seasoning' ? (isZh ? '已复制' : 'Copied') : (isZh ? '复制' : 'Copy')}
                      </Button>
                    </div>

                    <ul className="space-y-2.5">
                      {seasoning?.map((season, i) => (
                        <li key={i} className="flex items-start gap-3 text-foreground">
                          <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary/80" />
                          <span className="text-sm leading-6 sm:text-base">{season}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 烹饪步骤 */}
            {instructions.length > 0 && (
              <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-md">
                <CardContent className="p-6">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                      <ListOrdered className="h-5 w-5 text-primary" />
                      {t('instructions')}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() =>
                        copyToClipboard(
                          instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n'),
                          'instructions'
                        )
                      }
                    >
                      {copiedSection === 'instructions' ? (
                        <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {copiedSection === 'instructions' ? (isZh ? '已复制' : 'Copied') : (isZh ? '复制' : 'Copy')}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {instructions?.map((step, i) => (
                      <div
                        key={i}
                        className="flex gap-4 rounded-xl border border-border/70 bg-muted/30 p-4"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="pt-0.5 text-sm leading-7 text-foreground sm:text-base">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 厨师小贴士 */}
            {chefTips.length > 0 && (
              <Card className="rounded-2xl border border-border/70 bg-card/95 shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      {t('chefTips')}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {chefTips?.map((tip, i) => (
                      <div key={i} className="flex gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                        <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                        <p className="text-sm leading-6 text-foreground sm:text-base">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
