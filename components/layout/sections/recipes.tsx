"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { Clock, Users, ChefHat } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

import { Recipe } from '@/lib/types';

// 获取 cuisine 的 CSS 类名
const getCuisineClassName = (cuisineName: string): string => {
  if (!cuisineName) return 'cuisine-other';
  
  // 支持中英文菜系名称映射
  const cuisineClassMap: { [key: string]: string } = {
    // 英文名称
    'Chinese': 'cuisine-chinese',
    'Italian': 'cuisine-italian',
    'French': 'cuisine-french',
    'Indian': 'cuisine-indian',
    'Japanese': 'cuisine-japanese',
    'Mediterranean': 'cuisine-mediterranean',
    'Thai': 'cuisine-thai',
    'Mexican': 'cuisine-mexican',
    'Others': 'cuisine-other',
    // 中文名称
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
  return cuisineName; // 现在直接从数据库获取本地化名称
};

export const RecipesSection = () => {
  const t = useTranslations('recipes');
  const tRecipe = useTranslations('recipeDisplay');
  const locale = useLocale();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // 从本地 API 获取食谱数据 - 只获取管理员添加的菜谱
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        // 获取管理员菜谱
        const response = await fetch(`/api/recipes?limit=8&lang=${locale}&adminOnly=true`);
        const data = await response.json();

        if (data.success) {
          // 转换API返回的数据格式以匹配前端期望的格式
          const transformedRecipes = (data.results || []).map((recipe: any) => ({
            id: recipe.id,
            title: recipe.title,
            imagePath: recipe.imagePath,
            description: recipe.description,
            tags: recipe.tags ? JSON.parse(recipe.tags) : [],
            cookingTime: recipe.cookingTime || 30,
            servings: recipe.servings || 4,
            difficulty: recipe.difficulty || 'easy',
            ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
            seasoning: recipe.seasoning ? JSON.parse(recipe.seasoning) : [],
            instructions: recipe.instructions ? JSON.parse(recipe.instructions) : [],
            chefTips: recipe.chefTips ? JSON.parse(recipe.chefTips) : [],
            cuisine: recipe.cuisine ? {
              id: recipe.cuisine.id,
              name: recipe.cuisine.name
            } : undefined,
            userId: recipe.user_id // 添加用户ID用于过滤
          }));

          setRecipes(transformedRecipes);
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
  }, [locale]);

  if (isLoading) {
    return (
      <section id="recipes" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
              {t('subtitle')}
            </p>
            <div className="flex justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="recipes" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('subtitle')}
          </p>
        </div>

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
                    src={recipe.imagePath || '/placeholder.svg'}
                    alt={recipe.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* 菜系标签 - 暂时隐藏，因为 Recipe 接口现在使用 cuisineId */}
                  {/* {recipe.cuisineId && (
                    <div className="absolute top-3 left-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-full ${getCuisineClassName('')}`}>
                        {localizedCuisineName}
                      </span>
                    </div>
                  )} */}

                  {/* 烹饪时间 */}
                  {recipe.cookingTime && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white bg-black/50 rounded-full px-2 py-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{recipe.cookingTime} {tRecipe('mins')}</span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors text-lg">
                    {recipe.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {recipe.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {recipe.servings && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{recipe.servings}</span>
                      </div>
                    )}
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
      </div>
    </section>
  );
};
