"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { Clock, Users, ChefHat } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { Recipe } from '@/lib/types';
import { getImageUrl } from '@/lib/config';

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
    'Others': 'cuisine-other',
    '中式': 'cuisine-chinese',
    '意式': 'cuisine-italian',
    '法式': 'cuisine-french',
    '印式': 'cuisine-indian',
    '日式': 'cuisine-japanese',
    '地中海': 'cuisine-mediterranean',
    '地中海式': 'cuisine-mediterranean',
    '泰式': 'cuisine-thai',
    '墨西哥': 'cuisine-mexican',
    '其他': 'cuisine-other'
  };
  return cuisineClassMap[cuisineName] || 'cuisine-other';
};

// 获取 cuisine 的本地化显示名称
const getLocalizedCuisineName = (cuisineName: string, locale: string): string => {
  if (!cuisineName) return locale === 'zh' ? '其他' : 'Other';
  return cuisineName;
};

interface RecipesListProps {
  locale: string;
}

export const RecipesList = ({ locale }: RecipesListProps) => {
  const t = useTranslations('recipes');
  const tRecipe = useTranslations('recipeDisplay');
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 从本地 API 获取食谱数据
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/recipes?type=all&page=${page}&limit=20&lang=${locale}`);
        const data = await response.json() as any;

        if (data.success) {
          // 转换API返回的数据格式以匹配前端期望的格式
          const transformedRecipes = (data.results || []).map((recipe: any) => ({
            id: recipe.id,
            title: recipe.title,
            imagePath: recipe.imagePath,
            description: recipe.description,
            tags: recipe.tags || [],
            cookingTime: recipe.cookingTime || 30,
            servings: recipe.servings || 4,
            difficulty: recipe.difficulty || 'easy',
            ingredients: recipe.ingredients || [],
            seasoning: recipe.seasoning || [],
            instructions: recipe.instructions || [],
            chefTips: recipe.chefTips || [],
            cuisine: recipe.cuisine ? {
              id: recipe.cuisine.id,
              name: recipe.cuisine.name
            } : undefined
          }));
          
          if (page === 1) {
            setRecipes(transformedRecipes);
          } else {
            setRecipes(prev => [...prev, ...transformedRecipes]);
          }
          
          setHasMore(transformedRecipes.length === 20);
        } else {
          console.error('Failed to fetch recipes:', data.error);
        }
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [locale, page]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <Spinner className="h-8 w-8 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              {t('loadingRecipes')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* 页面标题 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-primary text-primary-dark mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('subtitle')}
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recipes.map((recipe) => {
            // 由于 Recipe 接口现在使用 cuisineId，这里暂时显示默认值
            const localizedCuisineName = getLocalizedCuisineName('', locale);

            return (
              <Link
                key={recipe.id}
                href={`/${locale}/recipe/${recipe.id}`}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image
                    src={getImageUrl(recipe.imagePath) || '/images/recipe-placeholder-bg.png'}
                    alt={recipe.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/recipe-placeholder-bg.png';
                      target.className = 'object-cover group-hover:scale-105 transition-transform duration-300';
                    }}
                  />

                  {/* 菜系标签 - 暂时隐藏，因为 Recipe 接口现在使用 cuisineId */}
                  {/* {recipe.cuisineId && (
                    <div className="absolute top-3 left-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-full ${getCuisineClassName('')}`}>
                        {localizedCuisineName}
                      </span>
                    </div>
                  )} */}

                  {/* 烹饪时间 - 移除，将移到卡片底部 */}
                </div>

                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors text-lg">
                    {recipe.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {recipe.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {/* 烹饪时间 */}
                    {recipe.cookingTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{recipe.cookingTime} {tRecipe('mins')}</span>
                      </div>
                    )}
                    {/* 人份 */}
                    {recipe.servings && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{recipe.servings}</span>
                      </div>
                    )}
                    {/* 难度 */}
                    {recipe.difficulty && (
                      <div className="flex items-center gap-1">
                        <ChefHat className="h-3 w-3" />
                        <span>{recipe.difficulty}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 加载更多按钮 */}
        {hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-[--color-primary-90] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  {t('loading')}
                </>
              ) : (
                t('loadMore')
              )}
            </button>
          </div>
        )}

        {/* 没有更多数据 */}
        {!hasMore && recipes.length > 0 && (
          <div className="text-center mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t('allRecipesDisplayed')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 