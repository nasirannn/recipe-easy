"use client";
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { 
  Clock, 
  Users, 
  ChefHat, 
  Copy, 
  Check, 
  ArrowLeft
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Recipe } from '@/lib/types';
import { getImageUrl } from '@/lib/config';

interface RecipeDetailProps {
  recipe: Recipe;
  locale: string;
}



export const RecipeDetail = ({ recipe, locale }: RecipeDetailProps) => {
  const t = useTranslations('recipeDisplay');
  const router = useRouter();
  const [copiedSection, setCopiedSection] = useState<'ingredients' | 'seasoning' | 'instructions' | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 解析JSON字符串为数组
  const parseJsonArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
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

  const copyToClipboard = async (text: string, type: 'ingredients' | 'seasoning' | 'instructions') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(type);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      // Failed to copy text
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: window.location.href,
        });
      } catch (err) {
        // Error sharing
      }
    } else {
      // Fallback: copy URL to clipboard
      await copyToClipboard(window.location.href, 'ingredients');
    }
  };

  const handleGoBack = () => {
    // 检查是否有历史记录可以返回
    if (window.history.length > 1) {
      router.back();
    } else {
      // 如果没有历史记录，则返回到首页
      router.push(`/${locale}/#recipes`);
    }
  };



  const getDifficultyLabel = (difficulty: string) => {
    // 如果是中文难度等级，直接返回
    if (difficulty === '简单' || difficulty === '中等' || difficulty === '困难') {
      return difficulty;
    }
    // 如果是英文难度等级，根据语言返回对应翻译
    switch (difficulty.toLowerCase()) {
      case 'easy': return locale === 'zh' ? '简单' : 'Easy';
      case 'medium': return locale === 'zh' ? '中等' : 'Medium';
      case 'hard': return locale === 'zh' ? '困难' : 'Hard';
      default: return difficulty;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* 左侧：图片和基本信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 主图片 */}
            {/* 菜谱图片 - 只在有图片时显示 */}
            {recipe.imagePath && (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={getImageUrl(recipe.imagePath)}
                  alt={recipe.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority
                  unoptimized={true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* 标题和描述 */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                {recipe.title}
              </h1>
              <div className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {recipe.description}
              </div>
              
              
              {/* 标签 - 移到描述下面 */}
              {tags.length > 0 && (
                <div className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, i) => (
                      <div key={i} className="tag-minimal">
                        <span className="text-[10px]">🏷️</span>
                        <span>{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 烹饪信息卡片 */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recipe.cookingTime && (
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[--color-secondary-10] rounded-xl">
                        <Clock className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('cookTime')}</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {recipe.cookingTime} {t('mins')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {recipe.servings && (
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[--color-secondary-10] rounded-xl">
                        <Users className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('serves')}</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {recipe.servings}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {recipe.difficulty && (
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[--color-secondary-10] rounded-xl">
                        <ChefHat className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('difficulty')}</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {getDifficultyLabel(recipe.difficulty)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 食材和调料 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 食材 */}
              {ingredients.length > 0 && (
                <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-2xl">🥬</span>
                        {t('ingredients')}
                      </h3>

                    </div>
                    <ul className="space-y-2">
                      {ingredients?.map((ingredient, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 调料 */}
              {seasoning.length > 0 && (
                <Card className="bg-linear-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-2xl">🧂</span>
                        {t('seasoning')}
                      </h3>

                    </div>
                    <ul className="space-y-2">
                      {seasoning?.map((season, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-amber-500 rounded-full shrink-0" />
                          <span>{season}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 烹饪步骤 */}
            {instructions.length > 0 && (
              <Card className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-2xl">📝</span>
                      {t('instructions')}
                    </h3>

                  </div>
                  <div className="space-y-6">
                    {instructions?.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold text-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 厨师小贴士 */}
            {chefTips.length > 0 && (
              <Card className="bg-linear-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2">
                      <span className="text-2xl">👩‍🍳</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('chefTips')}
                    </h3>
                  </div>
                                          <div className="space-y-3">
                          {chefTips?.map((tip, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2" />
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{tip}</p>
                            </div>
                          ))}
                        </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：快速信息 */}
          <div className="space-y-6 h-fit">
            {/* 快速信息卡片 */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg sticky top-24 self-start">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {locale === 'zh' ? '快速信息' : 'Quick Info'}
                </h3>
                <div className="space-y-4">
                  {recipe.cookingTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('cookTime')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {recipe.cookingTime} {t('mins')}
                      </span>
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('serves')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {recipe.servings}
                      </span>
                    </div>
                  )}
                  {recipe.difficulty && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('difficulty')}</span>
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {getDifficultyLabel(recipe.difficulty)}
                      </span>
                    </div>
                  )}
                  {/* 菜系信息 - 暂时隐藏，因为 Recipe 接口现在使用 cuisineId */}
                  {/* {recipe.cuisineId && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{locale === 'zh' ? '菜系' : 'Cuisine'}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Cuisine ID: {recipe.cuisineId}
                      </span>
                    </div>
                  )} */}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      const allContent = [
                        recipe.title,
                        '',
                        recipe.description,
                        '',
                        `${t('ingredients')}:`,
                        ...(ingredients?.map(ingredient => `• ${ingredient}`) || []),
                        '',
                        `${t('seasoning')}:`,
                        ...(seasoning?.map(season => `• ${season}`) || []),
                        '',
                        `${t('instructions')}:`,
                        ...(instructions?.map((instr, idx) => `${idx + 1}. ${instr}`) || []),
                        '',
                        `${t('chefTips')}:`,
                        ...(chefTips?.map(tip => `• ${tip}`) || [])
                      ].join('\n');
                      copyToClipboard(allContent, 'ingredients');
                    }}
                  >
                    {copiedSection === 'ingredients' ? (
                      <Check className="w-4 h-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {locale === 'zh' ? '复制菜谱' : 'Copy Full Recipe'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGoBack}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {locale === 'zh' ? '返回' : 'Back'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}; 