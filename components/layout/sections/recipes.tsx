"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, ChefHat } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

// Recipe 类型定义
type Recipe = {
  id: number;
  title: string;
  image_url: string;
  description: string;
  tags: string[];
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  ingredients?: string[];
  seasoning?: string[];
  instructions?: string[];
  chefTips?: string[];
  cuisine?: {
    id: number;
    name: string;
  };
};

// 获取 cuisine 的 CSS 类名
const getCuisineClassName = (cuisineName: string): string => {
  const cuisineClassMap: { [key: string]: string } = {
    'Chinese': 'chinese',
    'Italian': 'italian',
    'French': 'french',
    'Indian': 'indian',
    'Japanese': 'japanese',
    'Mediterranean': 'mediterranean',
    'Thai': 'thai',
    'Mexican': 'mexican'
  };
  return cuisineClassMap[cuisineName] || 'other';
};

// 获取 cuisine 的本地化显示名称
const getLocalizedCuisineName = (cuisineName: string, locale: string): string => {
  if (locale === 'zh') {
    const chineseCuisineMap: { [key: string]: string } = {
      'Chinese': '中式',
      'Italian': '意式',
      'French': '法式',
      'Indian': '印式',
      'Japanese': '日式',
      'Mediterranean': '地中海',
      'Thai': '泰式',
      'Mexican': '墨西哥'
    };
    return chineseCuisineMap[cuisineName] || cuisineName;
  }
  return cuisineName;
};

export const RecipesSection = () => {
  const t = useTranslations('recipes');
  const tRecipe = useTranslations('recipeDisplay');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // 从本地 API 获取食谱数据
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/recipes?limit=8&lang=${locale}`);
        const data = await response.json();

        if (data.success) {
          setRecipes(data.data);
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

  const handleOpenDialog = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  return (
    <section id="recipes" className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl text-primary font-bold text-center mb-2 md:mb-4">
          {t('title')}
        </h2>
        <p className="text-center text-xl text-muted-foreground dark:text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner />
          </div>
        ) : (
          <Dialog
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setSelectedRecipe(null);
              }
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {recipes.map((recipe) => {
                const cuisineName = recipe.cuisine?.name || 'Other';
                const cuisineClass = getCuisineClassName(cuisineName);
                const localizedCuisineName = getLocalizedCuisineName(cuisineName, locale);

                return (
                  <DialogTrigger key={recipe.id} asChild>
                    <div
                      className="cursor-pointer group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      onClick={() => handleOpenDialog(recipe)}
                    >
                      {/* 图片区域 */}
                      <div className="relative w-full h-80 overflow-hidden">
                        <Image
                          src={recipe.image_url || '/placeholder.svg'}
                          alt={recipe.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* 内容区域 */}
                      <div className="p-6">
                        {/* 菜品名称 */}
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                          {recipe.title}
                        </h3>

                        {/* 标签区域 */}
                        <div className="flex items-center justify-between">
                          {/* Cuisine 标签 */}
                          <span className={`cuisine-${cuisineClass} px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide`}>
                            {localizedCuisineName}
                          </span>

                          {/* 烹饪时间 */}
                          {recipe.cookTime && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">{recipe.cookTime} {tRecipe('mins')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                );
              })}
            </div>
            {selectedRecipe && (
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
                <div className="recipe-detail">
                  {/* 顶部图片和标题区域 */}
                  <div className="relative w-full h-80">
                    <Image
                      src={selectedRecipe.image_url || '/placeholder.svg'}
                      alt={selectedRecipe.title}
                      fill
                      sizes="100vw"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                      <div className="p-6 text-white">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">{selectedRecipe.title}</h2>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {selectedRecipe.tags.map((tag, i) => (
                            <Badge key={i} className="bg-primary/80 text-white border-none">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-8">
                    {/* 描述和基本信息 */}
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{selectedRecipe.description}</p>
                      
                      {/* 烹饪信息 */}
                      <div className="flex flex-wrap gap-6 mt-4">
                        {selectedRecipe.cookTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <span>{tRecipe('cookTime')}: {selectedRecipe.cookTime} {tRecipe('mins')}</span>
                          </div>
                        )}
                        {selectedRecipe.servings && (
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span>{tRecipe('serves')}: {selectedRecipe.servings}</span>
                          </div>
                        )}
                        {selectedRecipe.difficulty && (
                          <div className="flex items-center gap-2">
                            <ChefHat className="h-5 w-5 text-primary" />
                            <span>{tRecipe('difficulty')}: {tRecipe(selectedRecipe.difficulty?.toLowerCase() || 'medium')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 食材 */}
                    {selectedRecipe.ingredients && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span>🥬</span>{tRecipe('ingredients')}
                        </h3>
                        <ul className="list-disc pl-5 space-y-2">
                          {selectedRecipe.ingredients.map((ingredient, i) => (
                            <li key={i} className="text-gray-700 dark:text-gray-300">{ingredient}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 调料 */}
                    {selectedRecipe.seasoning && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span>🧂</span>{tRecipe('seasoning')}
                        </h3>
                        <ul className="list-disc pl-5 space-y-2">
                          {selectedRecipe.seasoning.map((season, i) => (
                            <li key={i} className="text-gray-700 dark:text-gray-300">{season}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 步骤 */}
                    {selectedRecipe.instructions && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span>📝</span>{tRecipe('instructions')}
                        </h3>
                        <ol className="space-y-4">
                          {selectedRecipe.instructions.map((step, i) => (
                            <li key={i} className="flex gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center mt-1">
                                {i + 1}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">{step}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    
                    {/* 厨师小贴士 */}
                    {selectedRecipe.chefTips && selectedRecipe.chefTips.length > 0 && (
                      <div className="bg-primary/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span>👩‍🍳</span>
                          <h3 className="text-lg font-semibold">{tRecipe('chefTips')}</h3>
                        </div>
                        <ul className="space-y-3">
                          {selectedRecipe.chefTips.map((tip, i) => (
                            <li key={i} className="flex gap-2">
                              <div className="flex-shrink-0 text-primary">•</div>
                              <p className="text-gray-700 dark:text-gray-300">{tip}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
        )}
      </div>
    </section>
  );
};
