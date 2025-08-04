"use client";
import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Users, 
  ChefHat, 
  Copy, 
  Check, 
  ArrowLeft,
  Share2,
  Heart,
  Bookmark
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

// Recipe 类型定义
type Recipe = {
  id: number;
  title: string;
  image_url: string;
  description: string;
  tags: string[];
  cook_time?: number;
  servings?: number;
  difficulty?: string;
  ingredients?: string[];
  seasoning?: string[];
  instructions?: string[];
  chef_tips?: string[];
  cuisine?: {
    id: number;
    name: string;
  };
};

interface RecipeDetailProps {
  recipe: Recipe;
  locale: string;
}

// 获取 cuisine 的 CSS 类名
const getCuisineClassName = (cuisineName: string): string => {
  if (!cuisineName) return 'cuisine-other';
  
  const cuisineClassMap: { [key: string]: string } = {
    'Chinese': 'cuisine-chinese',
    'Italian': 'cuisine-italian',
    'French': 'cuisine-french',
    'Indian': 'cuisine-indian',
    'Japanese': 'cuisine-japanese',
    'Mediterranean': 'cuisine-mediterranean',
    'Thai': 'cuisine-thai',
    'Mexican': 'cuisine-mexican',
    '中式': 'cuisine-chinese',
    '意式': 'cuisine-italian',
    '法式': 'cuisine-french',
    '印式': 'cuisine-indian',
    '日式': 'cuisine-japanese',
    '地中海': 'cuisine-mediterranean',
    '地中海式': 'cuisine-mediterranean',
    '泰式': 'cuisine-thai',
    '墨西哥': 'cuisine-mexican'
  };
  return cuisineClassMap[cuisineName] || 'cuisine-other';
};

export const RecipeDetail = ({ recipe, locale }: RecipeDetailProps) => {
  const t = useTranslations('recipeDisplay');
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
        console.error('Failed to parse JSON:', e);
        return [];
      }
    }
    return [];
  };

  // 解析数据
  const ingredients = parseJsonArray(recipe.ingredients);
  const seasoning = parseJsonArray(recipe.seasoning);
  const instructions = parseJsonArray(recipe.instructions);
  const chefTips = parseJsonArray(recipe.chef_tips);
  const tags = parseJsonArray(recipe.tags);

  const copyToClipboard = async (text: string, type: 'ingredients' | 'seasoning' | 'instructions') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(type);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
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
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy URL to clipboard
      await copyToClipboard(window.location.href, 'ingredients');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'hard': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：图片和基本信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 主图片 */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={recipe.image_url || '/placeholder.svg'}
                alt={recipe.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* 返回按钮 - 左上角半透明 */}
              <Link 
                href="/#recipes"
                className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-200 group"
              >
                <ArrowLeft className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              </Link>
            </div>

            {/* 标题和描述 */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                {recipe.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {recipe.description}
              </p>
              
              {/* 标签 - 移到描述下面 */}
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <Badge key={i} className="bg-white/80 text-gray-800 border-none">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 烹饪信息卡片 */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recipe.cook_time && (
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('cookTime')}</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {recipe.cook_time} {t('mins')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {recipe.servings && (
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                        <Users className="h-6 w-6 text-blue-600" />
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
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                        <ChefHat className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('difficulty')}</p>
                        <p className={`text-lg font-semibold ${getDifficultyColor(recipe.difficulty)} px-2 py-1 rounded-md`}>
                          {recipe.difficulty}
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
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-2xl">🥬</span>
                        {t('ingredients')}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const contentToCopy = [
                            recipe.title,
                            '',
                            `${t('ingredients')}:`,
                            ...ingredients.map(ingredient => `• ${ingredient}`)
                          ].join('\n');
                          copyToClipboard(contentToCopy, 'ingredients');
                        }}
                        className="h-8 w-8 p-0"
                      >
                        {copiedSection === 'ingredients' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </Button>
                    </div>
                    <ul className="space-y-2">
                      {ingredients.map((ingredient, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 调料 */}
              {seasoning.length > 0 && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-2xl">🧂</span>
                        {t('seasoning')}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const contentToCopy = [
                            recipe.title,
                            '',
                            `${t('seasoning')}:`,
                            ...seasoning.map(season => `• ${season}`)
                          ].join('\n');
                          copyToClipboard(contentToCopy, 'seasoning');
                        }}
                        className="h-8 w-8 p-0"
                      >
                        {copiedSection === 'seasoning' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </Button>
                    </div>
                    <ul className="space-y-2">
                      {seasoning.map((season, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
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
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-2xl">📝</span>
                      {t('instructions')}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const contentToCopy = [
                          recipe.title,
                          '',
                          `${t('instructions')}:`,
                          ...instructions.map((instr, idx) => `${idx + 1}. ${instr}`)
                        ].join('\n');
                        copyToClipboard(contentToCopy, 'instructions');
                      }}
                      className="h-8 w-8 p-0"
                    >
                      {copiedSection === 'instructions' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </Button>
                  </div>
                  <div className="space-y-6">
                    {instructions.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center font-semibold text-sm">
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
              <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-0 shadow-lg">
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
                    {chefTips.map((tip, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2" />
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：快速信息 */}
          <div className="space-y-6">
            {/* 快速信息卡片 */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {locale === 'zh' ? '快速信息' : 'Quick Info'}
                </h3>
                <div className="space-y-4">
                  {recipe.cook_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('cookTime')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {recipe.cook_time} {t('mins')}
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
                      <span className={`font-semibold px-2 py-1 rounded-md text-sm ${getDifficultyColor(recipe.difficulty)}`}>
                        {recipe.difficulty}
                      </span>
                    </div>
                  )}
                  {recipe.cuisine?.name && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{locale === 'zh' ? '菜系' : 'Cuisine'}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {recipe.cuisine.name}
                      </span>
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    onClick={() => {
                      const allContent = [
                        recipe.title,
                        '',
                        recipe.description,
                        '',
                        `${t('ingredients')}:`,
                        ...ingredients.map(ingredient => `• ${ingredient}`),
                        '',
                        `${t('seasoning')}:`,
                        ...seasoning.map(season => `• ${season}`),
                        '',
                        `${t('instructions')}:`,
                        ...instructions.map((instr, idx) => `${idx + 1}. ${instr}`),
                        '',
                        `${t('chefTips')}:`,
                        ...chefTips.map(tip => `• ${tip}`)
                      ].join('\n');
                      copyToClipboard(allContent, 'ingredients');
                    }}
                  >
                    {locale === 'zh' ? '复制完整菜谱' : 'Copy Full Recipe'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleShare}
                  >
                    {locale === 'zh' ? '分享菜谱' : 'Share Recipe'}
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