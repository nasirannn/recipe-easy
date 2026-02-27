"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

import { Recipe } from '@/lib/types';
import { getImageUrl } from '@/lib/config';
import { SectionHeader } from '@/components/layout/section-header';

export const RecipesSection = () => {
  const t = useTranslations('recipes');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userInteracting, setUserInteracting] = useState(false);

  // 从本地 API 获取食谱数据 - 获取最近创建的6个菜谱
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        // 调用通用菜谱接口，限制为最近创建的6个有图片菜谱
        const response = await fetch(`/api/recipes?type=latest&limit=6&page=1&lang=${locale}&withImage=1`);
        const data = await response.json() as any;

        if (data.success) {
          setRecipes(data.results || []);
        } else {
          // Failed to fetch recipes
        }
      } catch (error) {
        // Error fetching recipes
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

  // 鼠标悬浮暂停轮播
  const handleMouseEnter = () => {
    setUserInteracting(true);
  };

  const handleMouseLeave = () => {
    setUserInteracting(false);
  };

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
      <section id="recipes" className="home-section">
        <div className="home-inner">
          <div className="home-card grid overflow-hidden lg:grid-cols-10">
            <div className="lg:col-span-6 aspect-square lg:aspect-[4/3] bg-muted flex items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
            <div className="lg:col-span-4 p-8 lg:p-12 flex flex-col justify-center bg-background/70">
              <div className="space-y-4">
                {/* 标题骨架 */}
                <Skeleton className="h-12 w-4/5" />
                {/* 描述骨架 */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                {/* 标签骨架 */}
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="recipes" className="home-section">
      <div className="home-inner">
        <SectionHeader
          eyebrow={t('title')}
          title={t('subtitle')}
          description={t('description1')}
          className="mb-8 md:mb-10"
        />
        <div
          className="home-card relative grid overflow-hidden lg:grid-cols-10 group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* 导航按钮 - 放在最外层，只在悬浮时显示 */}
          <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" style={{ zIndex: 50 }}>
            <button
              onClick={goToPrevious}
              className="bg-white/20 hover:bg-white/30 text-white h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto backdrop-blur-md hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Previous recipe"
            >
              <ChevronLeft className="w-5 h-5 stroke-[3]" />
            </button>
            <button
              onClick={goToNext}
              className="bg-white/20 hover:bg-white/30 text-white h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto backdrop-blur-md hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Next recipe"
            >
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>

          {/* 左侧：图片 */}
          <div className="lg:col-span-6 relative group">
          {displayRecipes.length > 0 ? (
              <div className="relative aspect-square lg:aspect-[4/3] overflow-hidden">
                {/* 底层图片 - 当前显示的图片 */}
                <Link href={`/${locale}/recipe/${displayRecipes[currentImageIndex].id}`} className="relative block w-full h-full">
                  <Image
                    key={`current-${currentImageIndex}`}
                    src={getImageUrl(displayRecipes[currentImageIndex].imagePath) || '/images/recipe-placeholder-bg.png'}
                    alt={displayRecipes[currentImageIndex].title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={`object-cover cursor-pointer transition-all duration-300 ${isTransitioning ? 'animate-fade-out' : ''
                    }`}
                    style={{
                      animation: isTransitioning ? 'fade-out 0.6s ease-in-out' : 'none',
                      zIndex: isTransitioning ? 5 : 10
                    }}
                    unoptimized={true}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/recipe-placeholder-bg.png';
                    }}
                    onClick={handleImageClick}
                  />
                </Link>
                
                {/* 顶层图片 - 下一张图片，通过透明度渐变显示 */}
                {isTransitioning && (
                  <Link href={`/${locale}/recipe/${displayRecipes[nextImageIndex].id}`} className="relative block w-full h-full">
                    <Image
                      key={`next-${nextImageIndex}`}
                      src={getImageUrl(displayRecipes[nextImageIndex].imagePath) || '/images/recipe-placeholder-bg.png'}
                      alt={displayRecipes[nextImageIndex].title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover animate-fade-in cursor-pointer transition-all duration-300"
                      style={{
                        animation: 'fade-in 0.6s ease-in-out',
                        zIndex: 10
                      }}
                      unoptimized={true}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/images/recipe-placeholder-bg.png';
                      }}
                      onClick={handleImageClick}
                    />
                  </Link>
                )}
            </div>
          ) : (
              <div className="aspect-square lg:aspect-[4/3] bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">{t('loadingRecipes')}</p>
            </div>
          )}
        </div>

          {/* 右侧：菜谱信息 */}
          <div className="lg:col-span-4 p-8 lg:p-12 flex flex-col justify-center relative bg-background/75 overflow-hidden">
            {/* 背景纹理图片 */}
            <div className="absolute inset-0 dark:opacity-5 pointer-events-none">
              <Image
                src="/images/ingredients-icon/grain-texture.png"
                alt=""
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
            <div className="relative z-10 space-y-4">
            {/* 菜谱标题 */}
              {displayRecipes.length > 0 ? (
                <Link href={`/${locale}/recipe/${displayRecipes[currentImageIndex].id}`}>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-tight cursor-pointer hover:text-primary transition-colors duration-200">
                    {displayRecipes[currentImageIndex].title}
                  </h2>
                </Link>
              ) : (
                <div className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-tight text-muted-foreground">
                  {t('loadingRecipes')}
              </div>
              )}

            {/* 菜谱描述 */}
              <p className="text-base leading-7 text-muted-foreground md:text-lg">
                {displayRecipes.length > 0 ? displayRecipes[currentImageIndex].description : ''}
              </p>

              {/* 标签 */}
              {displayRecipes.length > 0 && displayRecipes[currentImageIndex].tags && Array.isArray(displayRecipes[currentImageIndex].tags) && displayRecipes[currentImageIndex].tags.length > 0 && (
                <div className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {displayRecipes[currentImageIndex].tags.slice(0, 3).map((tag, index) => (
                      <div key={index} className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        <Tag className="h-3.5 w-3.5 text-primary/80" />
                        <span>{tag}</span>
                  </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
