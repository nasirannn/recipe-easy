"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { Clock, Users, ChefHat, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

import { Recipe } from '@/lib/types';
import { getImageUrl } from '@/lib/config';

// 获取 cuisine 的 CSS 类名 - 现在直接从数据库获取
const getCuisineClassName = (cuisine: any): string => {
  if (!cuisine) return 'cuisine-other';
  return cuisine.cssClass || 'cuisine-other';
};

// 获取 cuisine 的本地化显示名称
const getLocalizedCuisineName = (cuisineName: string, locale: string): string => {
  if (!cuisineName) return locale === 'zh' ? '其他' : 'Other';
  return cuisineName; // 现在直接从数据库获取本地化名称
};

export const RecipesSection = () => {
  const t = useTranslations('recipes');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userInteracting, setUserInteracting] = useState(false);

  // 从本地 API 获取食谱数据 - 只获取管理员最近创建的5个菜谱
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        // 调用管理员菜谱接口，限制为最近创建的5个菜谱
        const response = await fetch(`/api/recipes/admin?limit=5&lang=${locale}`);
        const data = await response.json();

        if (data.success) {
          setRecipes(data.data?.recipes || []);
        } else {
          console.error('Failed to fetch admin recipes:', data.error);
        }
      } catch (error) {
        console.error('Error fetching admin recipes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [locale]);

  // 自动轮播效果 - 当用户交互时暂停
  useEffect(() => {
    if (recipes.length === 0 || userInteracting) return;
    const interval = setInterval(() => {
      if (!isTransitioning) {
        const nextIndex = (currentImageIndex + 1) % Math.min(recipes.length, 6);
        setNextImageIndex(nextIndex);
        setIsTransitioning(true);
        
        // 增加过渡时间，使动画效果更明显
        setTimeout(() => {
          setCurrentImageIndex(nextIndex);
          setNextImageIndex((nextIndex + 1) % Math.min(recipes.length, 6));
          setIsTransitioning(false);
        }, 600); // 从300ms增加到600ms，与CSS动画时间保持一致
      }
    }, 4000); // 每4秒切换一次

    return () => clearInterval(interval);
  }, [recipes.length, currentImageIndex, isTransitioning, userInteracting]);

  // 手动切换图片
  const goToNext = () => {
    if (isTransitioning) return;
    setUserInteracting(true);
    const nextIndex = (currentImageIndex + 1) % Math.min(recipes.length, 6);
    setNextImageIndex(nextIndex);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentImageIndex(nextIndex);
      setNextImageIndex((nextIndex + 1) % Math.min(recipes.length, 6));
      setIsTransitioning(false);
      // 重置用户交互状态
      setTimeout(() => setUserInteracting(false), 2000);
    }, 600); // 从300ms增加到600ms，与CSS动画时间保持一致
  };

  const goToPrevious = () => {
    if (isTransitioning) return;
    setUserInteracting(true);
    const prevIndex = currentImageIndex === 0 ? Math.min(recipes.length - 1, 5) : currentImageIndex - 1;
    setNextImageIndex(prevIndex);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentImageIndex(prevIndex);
      setNextImageIndex((prevIndex + 1) % Math.min(recipes.length, 6));
      setIsTransitioning(false);
      // 重置用户交互状态
      setTimeout(() => setUserInteracting(false), 2000);
    }, 600); // 从300ms增加到600ms，与CSS动画时间保持一致
  };

  // 处理图片点击 - 立即停止过渡并跳转
  const handleImageClick = () => {
    // 立即停止任何正在进行的过渡
    if (isTransitioning) {
      setIsTransitioning(false);
    }
    setUserInteracting(true);
    // 2秒后恢复自动轮播
    setTimeout(() => setUserInteracting(false), 2000);
  };

  // 获取要展示的图片（最多9张）
  const displayRecipes = recipes.slice(0, 9);

  if (isLoading) {
    return (
      <section id="recipes" className="container py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="grid lg:grid-cols-2 place-items-center gap-8 lg:gap-24">
          <div className="w-full order-2 lg:order-1">
            <div className="flex justify-center items-center aspect-[4/3] sm:aspect-[3/2] bg-gray-200 dark:bg-gray-700 rounded-lg min-h-[280px] sm:min-h-[320px] lg:min-h-[400px]">
              <Spinner className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </div>
          <div className="text-center lg:text-left order-1 lg:order-2">
            <h2 className="text-base sm:text-lg text-secondary mb-2 tracking-wider">
              {t('title')}
            </h2>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              {t('subtitle')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
              {t('description1')}
            </p>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
              {t('description2')}
            </p>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
              {t('description3')}
            </p>
            <div className="flex justify-center lg:justify-start">
              <Spinner className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="recipes" className="container py-8 sm:py-12 lg:py-16 xl:py-16">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-24">
        {/* 左侧：图片轮播 */}
        <div className="w-full order-2 lg:order-1">
          {displayRecipes.length > 0 ? (
            <div className="relative">
              <div className="relative aspect-[4/3] sm:aspect-[3/2] overflow-hidden rounded-lg shadow-lg min-h-[280px] sm:min-h-[320px] lg:min-h-[400px]">
                {/* 底层图片 - 当前显示的图片 */}
                <Link href={`/${locale}/recipe/${displayRecipes[currentImageIndex].id}`}>
                  <Image
                    key={`current-${currentImageIndex}`}
                    src={getImageUrl(displayRecipes[currentImageIndex].imagePath) || '/images/recipe-placeholder-bg.png'}
                    alt={displayRecipes[currentImageIndex].title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 50vw, 25vw"
                    className={`object-cover cursor-pointer hover:scale-105 transition-all duration-300 ${
                      isTransitioning ? 'animate-fade-out' : ''
                    }`}
                    style={{
                      animation: isTransitioning ? 'fade-out 0.6s ease-in-out' : 'none',
                      zIndex: isTransitioning ? 5 : 10
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/recipe-placeholder-bg.png';
                      target.className = `object-cover cursor-pointer hover:scale-105 transition-all duration-300 ${
                        isTransitioning ? 'animate-fade-out' : ''
                      }`;
                    }}
                    onClick={handleImageClick}
                  />
                </Link>
                
                {/* 顶层图片 - 下一张图片，通过透明度渐变显示 */}
                {isTransitioning && (
                  <Link href={`/${locale}/recipe/${displayRecipes[nextImageIndex].id}`}>
                    <Image
                      key={`next-${nextImageIndex}`}
                      src={getImageUrl(displayRecipes[nextImageIndex].imagePath) || '/images/recipe-placeholder-bg.png'}
                      alt={displayRecipes[nextImageIndex].title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover animate-fade-in cursor-pointer hover:scale-105 transition-all duration-300"
                      style={{
                        animation: 'fade-in 0.6s ease-in-out',
                        zIndex: 10
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/images/recipe-placeholder-bg.png';
                        target.className = 'object-cover animate-fade-in cursor-pointer hover:scale-105 transition-all duration-300';
                      }}
                      onClick={handleImageClick}
                    />
                  </Link>
                )}

                {/* 菜系标签 */}
                {displayRecipes[currentImageIndex].cuisine_id && (
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-full ${getCuisineClassName(displayRecipes[currentImageIndex].cuisine)}`}>
                      {getLocalizedCuisineName(displayRecipes[currentImageIndex].cuisine?.name, locale)}
                    </span>
                  </div>
                )}

                {/* 导航按钮 */}
                {displayRecipes.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-all duration-200"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-all duration-200"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-[4/3] sm:aspect-[3/2] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center min-h-[280px] sm:min-h-[320px] lg:min-h-[400px]">
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{t('loadingRecipes')}</p>
            </div>
          )}
        </div>

        {/* 右侧：文字内容 */}
        <div className="text-center lg:text-left flex flex-col h-full order-1 lg:order-2">
          <div className="flex flex-col h-full">
            <h2 className="text-base sm:text-lg text-secondary mb-2 tracking-wider">
              {t('title')}
            </h2>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              {t('subtitle')}
            </h2>
            
            {/* 菜谱内容包装器 - 使用flex-1占满剩余空间，移除底部margin */}
            <div className="bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl p-4 sm:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xs flex-1 flex flex-col">
              <div className="flex-1">
                <p className="text-base sm:text-lg text-foreground mb-3 sm:mb-4 line-clamp-2">
                  {displayRecipes.length > 0 ? (
                    displayRecipes[currentImageIndex].title
                  ) : (
                    t('description1')
                  )}
                </p>
                
                {/* 菜系标签 - 放在名称下面 */}
                {displayRecipes.length > 0 && displayRecipes[currentImageIndex].cuisine?.name && displayRecipes[currentImageIndex].cuisine.name.trim() !== '' && (
                  <div className="mb-4 sm:mb-6">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium text-white rounded-full shadow-xs ${getCuisineClassName(displayRecipes[currentImageIndex].cuisine)}`}>
                      {getLocalizedCuisineName(displayRecipes[currentImageIndex].cuisine.name, locale)}
                    </span>
                  </div>
                )}
                <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 line-clamp-2">
                  {displayRecipes.length > 0 ? (
                    displayRecipes[currentImageIndex].description || t('description2')
                  ) : (
                    t('description2')
                  )}
                </p>
              </div>
              
              {/* 底部信息 - 固定在底部 */}
              <div className="mt-auto pt-2">
                {displayRecipes.length > 0 ? (
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3">
                    {displayRecipes[currentImageIndex].cookingTime && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/50 dark:bg-slate-800/50 rounded-full text-sm">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">{displayRecipes[currentImageIndex].cookingTime}</span>
                      </span>
                    )}
                    {displayRecipes[currentImageIndex].servings && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/50 dark:bg-slate-800/50 rounded-full text-sm">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">{displayRecipes[currentImageIndex].servings}</span>
                      </span>
                    )}
                    {displayRecipes[currentImageIndex].difficulty && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/50 dark:bg-slate-800/50 rounded-full text-sm">
                        <ChefHat className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">{displayRecipes[currentImageIndex].difficulty}</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-base sm:text-lg text-muted-foreground mb-0">
                    {t('description3')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
