"use client"

import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { IngredientSelector } from "./ingredients-selector";
import { Sparkles, X, RotateCcw, Minus, Plus, Box, PencilLine } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthModal } from "@/components/auth/auth-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCuisines } from "@/hooks/use-cuisines";
import { useTranslations, useLocale } from 'next-intl';
import { RecipeFormData, Ingredient } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import Image from "next/image";
import { CATEGORIES_CONFIG, CAROUSEL_CONFIG } from '@/lib/config';
import { useAuth } from "@/contexts/auth-context";

interface RecipeFormProps {
  formData: RecipeFormData;
  onFormChange: (data: RecipeFormData) => void;
  onSubmit: () => void;
  loading: boolean;
  showRecipe: boolean;
  setShowRecipe: (show: boolean) => void;
  // 新增：tab相关props
  activeTab?: 'recipe-maker' | 'meal-planner';
  onTabChange?: (tab: 'recipe-maker' | 'meal-planner') => void;
  mealPlannerText?: string;
  onMealPlannerTextChange?: (text: string) => void;
  onMealPlannerClear?: () => void;
  onMealPlannerSubmit?: () => void;
}

// 自定义 Hook: 食材操作管理
const useIngredientsActions = (formData: RecipeFormData, onFormChange: (data: RecipeFormData) => void) => {
  const isSameIngredientId = (left: string | number, right: string | number) =>
    String(left) === String(right);

  const addIngredient = useCallback((ingredient: Ingredient) => {
    const isAlreadySelected = formData.ingredients.some(
      selected => isSameIngredientId(selected.id, ingredient.id)
    );
    
    if (!isAlreadySelected) {
      onFormChange({
        ...formData,
        ingredients: [...formData.ingredients, ingredient]
      });
    }
  }, [formData, onFormChange]);

  const removeIngredient = useCallback((ingredientId: string | number) => {
    onFormChange({
      ...formData,
      ingredients: formData.ingredients.filter(item => !isSameIngredientId(item.id, ingredientId))
    });
  }, [formData, onFormChange]);

  const clearIngredients = useCallback(() => {
    onFormChange({ ...formData, ingredients: [] });
  }, [formData, onFormChange]);

  return { addIngredient, removeIngredient, clearIngredients };
};

// 自定义 Hook: 响应式检测
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile };
};

interface BasketIngredientIconProps {
  ingredient: Ingredient;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

const DESKTOP_BASKET_ICON_POSITIONS = [
  "left-[23%] top-[27%] rotate-[-10deg]",
  "left-[49%] top-[20%] rotate-[6deg]",
  "left-[74%] top-[29%] rotate-[-4deg]",
  "left-[30%] top-[44%] rotate-[8deg]",
  "left-[56%] top-[40%] rotate-[-6deg]",
  "left-[72%] top-[50%] rotate-[10deg]",
  "left-[25%] top-[63%] rotate-[-8deg]",
  "left-[47%] top-[67%] rotate-[5deg]",
  "left-[68%] top-[64%] rotate-[-5deg]",
] as const;

const MOBILE_BASKET_ICON_POSITIONS = [
  "left-[24%] top-[28%] rotate-[-9deg]",
  "left-[50%] top-[21%] rotate-[6deg]",
  "left-[73%] top-[30%] rotate-[-4deg]",
  "left-[31%] top-[45%] rotate-[8deg]",
  "left-[56%] top-[41%] rotate-[-6deg]",
  "left-[70%] top-[50%] rotate-[9deg]",
  "left-[26%] top-[63%] rotate-[-8deg]",
  "left-[47%] top-[66%] rotate-[5deg]",
  "left-[67%] top-[63%] rotate-[-5deg]",
] as const;

const BasketIngredientIcon = ({
  ingredient,
  className,
  imageClassName,
  fallbackClassName,
}: BasketIngredientIconProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const iconPath = ingredient.slug
    ? `/images/ingredients-icon/${ingredient.slug}.svg`
    : null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden",
        className
      )}
    >
      {iconPath && !imageFailed ? (
        <Image
          src={iconPath}
          alt={ingredient.name}
          width={28}
          height={28}
          className={cn("h-7 w-7 object-contain", imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Box className={cn("h-4 w-4 text-muted-foreground", fallbackClassName)} />
      )}
    </span>
  );
};

export const RecipeForm = ({
  formData,
  onFormChange,
  onSubmit,
  loading,
  setShowRecipe,
}: RecipeFormProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { cuisines, loading: cuisinesLoading } = useCuisines();
  const t = useTranslations('recipeForm');
  const tIngredientSelector = useTranslations('ingredientSelector');
  const locale = useLocale();
  
  // 使用自定义 hooks
  const { isMobile } = useResponsive();
  const { addIngredient, removeIngredient, clearIngredients } = useIngredientsActions(formData, onFormChange);
  
  // 分类相关状态
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES_CONFIG>('meat');
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, { name: string; icon?: string; color?: string }>>({});
  const desktopBasketBadgeRef = useRef<HTMLSpanElement | null>(null);
  const mobileBasketBadgeRef = useRef<HTMLSpanElement | null>(null);
  const desktopBasketVisualRef = useRef<HTMLDivElement | null>(null);
  const mobileBasketVisualRef = useRef<HTMLDivElement | null>(null);
  const [desktopBasketEditorOpen, setDesktopBasketEditorOpen] = useState(false);
  const [mobileBasketEditorOpen, setMobileBasketEditorOpen] = useState(false);
  
  // 新增：搜索相关状态
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(true);
  const [ingredientsError, setIngredientsError] = useState<string | null>(null);

  // 处理分类变更 - 使用 useCallback 优化
  const handleCategoryChange = useCallback((categoryId: keyof typeof CATEGORIES_CONFIG) => {
    setActiveCategory(categoryId);
  }, []);

  const playIngredientToBasketAnimation = useCallback((ingredient: Ingredient, sourceRect?: DOMRect) => {
    if (!sourceRect || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const targetBasketVisual =
      (isMobile ? mobileBasketVisualRef.current : desktopBasketVisualRef.current) ||
      desktopBasketVisualRef.current ||
      mobileBasketVisualRef.current;

    const targetBadge =
      (isMobile ? mobileBasketBadgeRef.current : desktopBasketBadgeRef.current) ||
      desktopBasketBadgeRef.current ||
      mobileBasketBadgeRef.current;

    const animationTarget = targetBasketVisual || targetBadge;

    if (!animationTarget) {
      return;
    }

    const targetRect = animationTarget.getBoundingClientRect();
    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const arcOffset = Math.max(18, Math.min(36, Math.abs(deltaX) * 0.12));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      animationTarget.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.08)' },
          { transform: 'scale(1)' },
        ],
        {
          duration: 180,
          easing: 'ease-out',
        }
      );
      return;
    }

    const flyingIcon = document.createElement('div');
    Object.assign(flyingIcon.style, {
      position: 'fixed',
      left: `${startX}px`,
      top: `${startY}px`,
      transform: 'translate(-50%, -50%) translate(0px, 0px) scale(1)',
      pointerEvents: 'none',
      zIndex: '80',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '9999px',
      border: '1px solid rgba(148, 163, 184, 0.35)',
      background: 'rgba(255, 255, 255, 0.95)',
      opacity: '0.95',
      boxShadow: '0 8px 18px rgba(15, 23, 42, 0.18)',
    });

    const iconPath = ingredient.slug
      ? `/images/ingredients-icon/${ingredient.slug}.svg`
      : null;

    if (iconPath) {
      const iconImage = document.createElement('img');
      iconImage.src = iconPath;
      iconImage.alt = '';
      Object.assign(iconImage.style, {
        width: '22px',
        height: '22px',
        objectFit: 'contain',
      });
      iconImage.onerror = () => {
        iconImage.remove();
        if (!flyingIcon.textContent) {
          flyingIcon.textContent = ingredient.name.slice(0, 1).toUpperCase();
        }
      };
      flyingIcon.appendChild(iconImage);
    } else {
      flyingIcon.textContent = ingredient.name.slice(0, 1).toUpperCase();
    }

    if (flyingIcon.textContent) {
      Object.assign(flyingIcon.style, {
        color: 'rgb(71, 85, 105)',
        fontSize: '12px',
        fontWeight: '700',
        lineHeight: '1',
      });
    }

    document.body.appendChild(flyingIcon);

    const flight = flyingIcon.animate(
      [
        { transform: 'translate(-50%, -50%) translate(0px, 0px) scale(1)', opacity: 0.95 },
        {
          transform: `translate(-50%, -50%) translate(${deltaX * 0.6}px, ${deltaY * 0.55 - arcOffset}px) scale(0.86)`,
          opacity: 0.9,
        },
        {
          transform: `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(0.28)`,
          opacity: 0,
        },
      ],
      {
        duration: 560,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }
    );

    flight.onfinish = () => {
      flyingIcon.remove();
    };

    animationTarget.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.18)' },
        { transform: 'scale(0.96)' },
        { transform: 'scale(1)' },
      ],
      {
        duration: 320,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    );
  }, [isMobile]);

  // 获取食材数据的函数 - 提取为可复用函数
  const fetchIngredientsData = useCallback(async () => {
    setIngredientsLoading(true);
    setIngredientsError(null);
    
    try {
      const response = await fetch(`/api/ingredients?lang=${locale}&limit=200`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json() as any;
      if (data.success && data.results) {
        setAllIngredients(data.results);
      } else {
        throw new Error(data.message || '获取食材数据失败');
      }
    } catch (error) {
      // 获取食材失败
      setIngredientsError(error instanceof Error ? error.message : '获取食材数据失败');
    } finally {
      setIngredientsLoading(false);
    }
  }, [locale]);

  // 新增：获取所有食材数据
  useEffect(() => {
    fetchIngredientsData();
  }, [fetchIngredientsData]);

  // 新增：获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?lang=${locale}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json() as any;

        if (data.success && data.results) {
          const categoriesMap: Record<string, { name: string; icon?: string; color?: string }> = {};
          data.results.forEach((category: any) => {
                  const categoryKey = category.slug as keyof typeof CATEGORIES_CONFIG;
      if (CATEGORIES_CONFIG[categoryKey]) {
        categoriesMap[categoryKey] = {
          name: category.name,
          icon: CATEGORIES_CONFIG[categoryKey].icon,
          color: CATEGORIES_CONFIG[categoryKey].color
        };
      }
          });
          setDynamicCategories(categoriesMap);
        }
      } catch (error) {
        // 获取分类失败
      }
    };
    fetchCategories();
  }, [locale]);

  // 检测屏幕尺寸 - 已移至 useResponsive hook

  // 监听showLoginModal事件
  useEffect(() => {
    const handleShowLoginModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener('showLoginModal', handleShowLoginModal);
    return () => window.removeEventListener('showLoginModal', handleShowLoginModal);
  }, []);

  useEffect(() => {
    if (formData.ingredients.length === 0) {
      setDesktopBasketEditorOpen(false);
      setMobileBasketEditorOpen(false);
    }
  }, [formData.ingredients.length]);

  // 轮播自动播放 - 使用常量配置优化
  useEffect(() => {
    const carousel = document.getElementById('meal-planner-carousel');
    if (!carousel) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      
      // 当到达重复的第一个元素时，重置到真正的第一个元素
      if (currentIndex >= CAROUSEL_CONFIG.TOTAL_ITEMS) {
        // 等待过渡动画完成后，无动画地重置位置
        setTimeout(() => {
          carousel.style.transition = 'none';
          carousel.style.transform = 'translateY(0px)';
          currentIndex = 0;
          
          // 恢复过渡动画
          setTimeout(() => {
            carousel.style.transition = `transform ${CAROUSEL_CONFIG.TRANSITION_DURATION}ms ease-in-out`;
          }, 10);
        }, CAROUSEL_CONFIG.TRANSITION_DURATION);
      } else {
        carousel.style.transform = `translateY(-${currentIndex * CAROUSEL_CONFIG.ITEM_HEIGHT}px)`;
      }
    }, CAROUSEL_CONFIG.INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // 处理生成按钮点击 - 使用常量配置优化
  const handleGenerateClick = useCallback(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (formData.ingredients.length >= 2) {
      onSubmit();
      setShowRecipe(true); // 设置显示菜谱结果

      // 滚动到loading动画位置
      setTimeout(() => {
        const loadingContainer = document.getElementById('loading-animation-container');
        if (loadingContainer) {
          loadingContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100); // 短暂延迟确保DOM更新
    }
  }, [authLoading, formData.ingredients.length, onSubmit, setShowRecipe, user]);

  // 处理份数减少
  const handleServingsDecrease = useCallback(() => {
    if (formData.servings > 1) {
      onFormChange({ ...formData, servings: formData.servings - 1 });
    }
  }, [formData, onFormChange]);

  // 处理份数增加
  const handleServingsIncrease = useCallback(() => {
    if (formData.servings < 8) {
      onFormChange({ ...formData, servings: formData.servings + 1 });
    }
  }, [formData, onFormChange]);

  // 处理烹饪时间变更
  const handleCookingTimeChange = useCallback((value: string) => {
    onFormChange({ ...formData, cookingTime: value as 'quick' | 'medium' | 'long' });
  }, [formData, onFormChange]);

  // 处理难度变更
  const handleDifficultyChange = useCallback((value: 'easy' | 'medium' | 'hard') => {
    onFormChange({ ...formData, difficulty: value });
  }, [formData, onFormChange]);

  // 处理菜系变更
  const handleCuisineChange = useCallback((value: string) => {
    onFormChange({ ...formData, cuisine: value });
  }, [formData, onFormChange]);

  const handleIngredientSelect = useCallback((ingredient: Ingredient, sourceRect?: DOMRect) => {
    const isAlreadySelected = formData.ingredients.some(
      (selected) => String(selected.id) === String(ingredient.id)
    );
    addIngredient(ingredient);
    if (!isAlreadySelected) {
      playIngredientToBasketAnimation(ingredient, sourceRect);
    }
  }, [formData.ingredients, addIngredient, playIngredientToBasketAnimation]);

  const activeCategoryName =
    dynamicCategories[activeCategory]?.name || tIngredientSelector(`categories.${activeCategory}`);
  const basketGridIngredients = formData.ingredients.slice(0, 9);
  const isZhLocale = locale.toLowerCase().startsWith("zh");
  const selectedIngredientNames = formData.ingredients.map((ingredient) => ingredient.name).join(", ");

  const renderBasketEditorList = (onAfterAction?: () => void) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {formData.ingredients.length} {t('ingredients')}
        </p>
        {formData.ingredients.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearIngredients();
              onAfterAction?.();
            }}
            className="inline-flex h-7 items-center rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
          >
            {t('reset')}
          </button>
        )}
      </div>

      {formData.ingredients.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noIngredients')}</p>
      ) : (
        <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
          {formData.ingredients.map((ingredient) => (
            <div
              key={`basket-editor-${ingredient.id}`}
              className="grid min-h-[44px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-muted/50"
            >
              <BasketIngredientIcon
                ingredient={ingredient}
                className="h-7 w-7"
                imageClassName="h-7 w-7"
                fallbackClassName="h-4 w-4"
              />
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {ingredient.name}
              </span>
              <button
                type="button"
                aria-label={`${isZhLocale ? '移除' : 'Remove'} ${ingredient.name}`}
                onClick={() => removeIngredient(ingredient.id)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderIngredientsSkeleton = (count: number) => (
    <div className="scrollbar-hide h-full overflow-y-auto pr-1">
      <div className="flex flex-wrap items-start gap-2.5 p-1.5 pr-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`ingredient-skeleton-${index}`}
            className="inline-flex min-h-[116px] w-[92px] shrink-0 flex-col items-center justify-start gap-2 rounded-xl border border-border/65 bg-card/95 px-2.5 py-2.5 shadow-sm"
          >
            <Skeleton className="h-11 w-11 rounded-full" />
            <Skeleton className="h-3 w-14 rounded-sm" />
            <Skeleton className="h-3 w-10 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-4">
      {/* 食材选择区域 */}
      <>
        {!isMobile ? (
            <div className="flex flex-col gap-4">
              <section className="rounded-xl bg-muted/45 p-2">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
                  {Object.entries(CATEGORIES_CONFIG).map(([categoryId, category]) => {
                    const Icon = category.icon;
                    const isActive = activeCategory === categoryId;
                    const categoryName =
                      dynamicCategories[categoryId]?.name || tIngredientSelector(`categories.${categoryId}`);

                    return (
                      <button
                        key={categoryId}
                        type="button"
                        aria-label={categoryName}
                        title={categoryName}
                        onClick={() => handleCategoryChange(categoryId as keyof typeof CATEGORIES_CONFIG)}
                        className={cn(
                          "flex min-h-[40px] w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2",
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "bg-transparent text-muted-foreground hover:bg-muted/65 hover:text-foreground"
                        )}
                      >
                        <span className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : category.color)}>
                          {Icon}
                        </span>
                        <span className="truncate whitespace-nowrap">{categoryName}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="grid grid-cols-[minmax(0,1fr)_19.5rem] gap-2">
                <div className="relative overflow-hidden rounded-2xl bg-muted/45 p-2">
                  <section className="flex h-[440px] min-h-0 flex-col overflow-hidden">
                    <div className="flex h-full min-h-0 flex-col">
                      <div className="min-h-0 flex-1 p-2">
                        {ingredientsLoading ? (
                          renderIngredientsSkeleton(18)
                        ) : ingredientsError ? (
                          <div className="flex h-full items-center justify-center">
                            <div className="max-w-xs space-y-3 px-4 text-center">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                                <X className="h-5 w-5 text-destructive" />
                              </div>
                              <div className="space-y-1.5">
                                <h3 className="text-sm font-semibold text-foreground">
                                  {tIngredientSelector('loadError')}
                                </h3>
                                <p className="text-xs text-muted-foreground">{ingredientsError}</p>
                              </div>
                              <button
                                type="button"
                                onClick={fetchIngredientsData}
                                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
                              >
                                <RotateCcw className="h-3 w-3" />
                                {tIngredientSelector('retry')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <IngredientSelector
                            selectedIngredients={formData.ingredients}
                            onIngredientSelect={handleIngredientSelect}
                            activeCategory={activeCategory}
                            onCategoryChange={handleCategoryChange}
                            allIngredients={allIngredients}
                            dynamicCategories={dynamicCategories}
                            hideHeader={true}
                          />
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-muted/45 p-2">
                  <aside className="flex h-[440px] min-h-0 flex-col overflow-hidden">
                    <div className="flex h-14 items-center justify-between gap-3 border-b border-dashed border-border/20 px-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">{t('basket')}</h3>
                        <span ref={desktopBasketBadgeRef} className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
                          {formData.ingredients.length}
                        </span>
                      </div>
                      {formData.ingredients.length > 0 && (
                        <Popover open={desktopBasketEditorOpen} onOpenChange={setDesktopBasketEditorOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              aria-label={isZhLocale ? '编辑已选食材' : 'Edit selected ingredients'}
                              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
                            >
                              <PencilLine className="h-4 w-4" />
                              <span>{isZhLocale ? '编辑' : 'Edit'}</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            sideOffset={8}
                            className="w-[min(92vw,22rem)] border-border/70 bg-card p-3 text-foreground"
                          >
                            {renderBasketEditorList()}
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden p-3">
                      {formData.ingredients.length === 0 ? (
                        <div className="flex h-full items-center justify-center px-4 text-center">
                          <div>
                            <div ref={desktopBasketVisualRef} className="mx-auto mb-3 w-[170px]">
                              <Image
                                src="/images/empty_vegetable_basket.webp"
                                alt=""
                                width={170}
                                height={170}
                                className="mx-auto h-auto w-[160px]"
                              />
                            </div>
                            <p className="text-sm font-semibold text-foreground">{t('noIngredients')}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {isZhLocale ? '从左侧分类中选择食材' : 'Select ingredients from the categories on the left'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center px-3 text-center">
                          <div ref={desktopBasketVisualRef} className="relative mb-3 w-[170px]">
                            <Image
                              src="/images/empty_vegetable_basket_topdowm.webp"
                              alt=""
                              width={170}
                              height={170}
                              className="mx-auto h-auto w-[160px]"
                            />
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <div className="relative h-full w-full">
                                {basketGridIngredients.map((ingredient, index) => (
                                  <span
                                    key={`desktop-basket-overlay-${ingredient.id}`}
                                    className={cn(
                                      "absolute -translate-x-1/2 -translate-y-1/2",
                                      DESKTOP_BASKET_ICON_POSITIONS[index]
                                    )}
                                  >
                                    <BasketIngredientIcon
                                      ingredient={ingredient}
                                      className="h-10 w-10"
                                      imageClassName="h-10 w-10"
                                      fallbackClassName="h-5 w-5"
                                    />
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="max-h-20 max-w-[15rem] overflow-y-auto text-xs leading-relaxed text-foreground">
                            {selectedIngredientNames}
                          </p>
                        </div>
                      )}
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="flex flex-col">
                <section className="space-y-3 border-b border-border/20 p-4">
                  <div className="flex h-11 items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                      {activeCategoryName}
                    </p>
                    <span className="inline-flex h-7 items-center rounded-full border border-border/70 bg-background/70 px-3 text-xs font-medium text-foreground">
                      {formData.ingredients.length} {t('ingredients')}
                    </span>
                  </div>

                  <Select
                    value={activeCategory}
                    onValueChange={(value) => handleCategoryChange(value as keyof typeof CATEGORIES_CONFIG)}
                  >
                    <SelectTrigger className="h-11 w-full cursor-pointer rounded-lg border-border/70 bg-background/70 text-sm transition-colors duration-200 hover:border-primary/50">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {CATEGORIES_CONFIG[activeCategory] && (() => {
                            const Icon = CATEGORIES_CONFIG[activeCategory].icon;
                            return <span className={cn("h-4 w-4 shrink-0", CATEGORIES_CONFIG[activeCategory].color)}>{Icon}</span>;
                          })()}
                          <span className="text-sm font-medium text-foreground">{activeCategoryName}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[280px] overflow-y-auto rounded-xl border-border/70 bg-card">
                      {Object.entries(CATEGORIES_CONFIG).map(([categoryId, category]) => {
                        const Icon = category.icon;
                        const categoryName =
                          dynamicCategories[categoryId]?.name || tIngredientSelector(`categories.${categoryId}`);

                        return (
                          <SelectItem
                            key={categoryId}
                            value={categoryId}
                            hideIndicator={true}
                            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-200 hover:bg-primary/5"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={cn("h-4 w-4 shrink-0", category.color)}>{Icon}</span>
                              <span className="font-medium">{categoryName}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </section>

                <section className="h-[320px] border-b border-border/20 p-3">
                  {ingredientsLoading ? (
                    renderIngredientsSkeleton(10)
                  ) : ingredientsError ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="max-w-xs space-y-3 px-4 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                          <X className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-semibold text-foreground">
                            {tIngredientSelector('loadError')}
                          </h3>
                          <p className="text-xs text-muted-foreground">{ingredientsError}</p>
                        </div>
                        <button
                          type="button"
                          onClick={fetchIngredientsData}
                          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {tIngredientSelector('retry')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <IngredientSelector
                      selectedIngredients={formData.ingredients}
                      onIngredientSelect={handleIngredientSelect}
                      activeCategory={activeCategory}
                      onCategoryChange={handleCategoryChange}
                      allIngredients={allIngredients}
                      dynamicCategories={dynamicCategories}
                      hideHeader={true}
                    />
                  )}
                </section>

                <section className="h-[280px] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{t('basket')}</h3>
                      <span ref={mobileBasketBadgeRef} className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
                        {formData.ingredients.length}
                      </span>
                    </div>
                    {formData.ingredients.length > 0 && (
                      <Sheet open={mobileBasketEditorOpen} onOpenChange={setMobileBasketEditorOpen}>
                        <SheetTrigger asChild>
                          <button
                            type="button"
                            aria-label={isZhLocale ? '编辑已选食材' : 'Edit selected ingredients'}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
                          >
                            <PencilLine className="h-4 w-4" />
                            <span>{isZhLocale ? '编辑' : 'Edit'}</span>
                          </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="max-h-[75vh] rounded-t-2xl border-border/70 px-4 pb-6 pt-8">
                          <SheetHeader className="mb-3 text-left">
                            <SheetTitle className="text-base font-semibold text-foreground">
                              {isZhLocale ? '已选食材' : 'Selected Ingredients'}
                            </SheetTitle>
                          </SheetHeader>
                          {renderBasketEditorList(() => setMobileBasketEditorOpen(false))}
                        </SheetContent>
                      </Sheet>
                    )}
                  </div>

                  <div className="min-h-0 h-[230px] overflow-hidden">
                    {formData.ingredients.length === 0 ? (
                      <div className="flex h-full items-center justify-center px-4 text-center">
                        <div>
                          <div ref={mobileBasketVisualRef} className="mx-auto mb-3 w-[166px]">
                            <Image
                              src="/images/empty_vegetable_basket.webp"
                              alt=""
                              width={166}
                              height={166}
                              className="mx-auto h-auto w-[150px]"
                            />
                          </div>
                          <p className="text-sm font-semibold text-foreground">{t('noIngredients')}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {isZhLocale ? '从分类中选择食材后会显示在这里' : 'Selected ingredients will appear here'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-3 text-center">
                        <div ref={mobileBasketVisualRef} className="relative mb-3 w-[166px]">
                          <Image
                            src="/images/empty_vegetable_basket_topdowm.webp"
                            alt=""
                            width={166}
                            height={166}
                            className="mx-auto h-auto w-[150px]"
                          />
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="relative h-full w-full">
                              {basketGridIngredients.map((ingredient, index) => (
                                <span
                                  key={`mobile-basket-overlay-${ingredient.id}`}
                                  className={cn(
                                    "absolute -translate-x-1/2 -translate-y-1/2",
                                    MOBILE_BASKET_ICON_POSITIONS[index]
                                  )}
                                >
                                  <BasketIngredientIcon
                                    ingredient={ingredient}
                                    className="h-8 w-8"
                                    imageClassName="h-8 w-8"
                                    fallbackClassName="h-4 w-4"
                                  />
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="max-h-16 max-w-[13.5rem] overflow-y-auto text-xs leading-relaxed text-foreground">
                          {selectedIngredientNames}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
        )}
      </>
      {/* 生成按钮和高级设置 */}
      <div className={cn("pb-2", !isMobile && "rounded-2xl bg-muted/45 px-3 pt-1 md:px-4")}>
        {/* 内容容器 */}
        <div className="w-full pt-4">
          {/* 桌面端：上方高级设置，下方独立生成按钮 */}
          {!isMobile ? (
            <div className="flex flex-col gap-3">
              {/* 左侧：高级设置选项 */}
              <div className="w-full">
                {/* 选项面板（常显） */}
                <div
                  className="flex w-full flex-wrap items-center gap-2.5 xl:flex-nowrap xl:gap-3"
                >
                  {/* Servings 步进器 */}
                  <div className="flex h-11 w-full min-w-[168px] flex-1 items-center gap-2 rounded-lg px-3 py-2.5">
                    <Label htmlFor="servings" className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                      <Image
                      src="/images/options-icon/serving.svg"
                      alt={t('servings')}
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                      unoptimized={true}
                    />
                    <span>{t('servings')}</span>
                    </Label>
                    <div className="flex items-center gap-1 rounded-md p-1 ml-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                        onClick={handleServingsDecrease}
                        disabled={formData.servings <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="w-6 px-1 text-center">
                        <span className="text-sm font-semibold text-foreground">{formData.servings}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                        onClick={handleServingsIncrease}
                        disabled={formData.servings >= 8}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Cooking Time 选择器 */}
                  <div className="flex h-11 w-full min-w-[168px] flex-1 items-center gap-2 rounded-lg px-3 py-2.5">
                    <Label htmlFor="cookingTime" className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                      <Image
                        src="/images/options-icon/cooking_time.svg"
                        alt={t('cookingTime')}
                        width={20}
                        height={20}
                        className="w-5 h-5 object-contain"
                        unoptimized={true}
                      />
                      <span>{t('cookingTime')}</span>
                    </Label>
                    <Select
                      value={formData.cookingTime}
                      onValueChange={handleCookingTimeChange}
                    >
                      <SelectTrigger id="cookingTime" className="ml-auto h-8 w-24 border-0 bg-background text-xs transition-colors duration-200 sm:w-28">
                        <SelectValue placeholder={t('selectCookingTime')} />
                      </SelectTrigger>
                      <SelectContent sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="z-50 border-border/70 bg-card text-foreground">
                        <SelectItem value="quick">{t('quick')}</SelectItem>
                        <SelectItem value="medium">{t('mediumTime')}</SelectItem>
                        <SelectItem value="long">{t('long')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Difficulty 选择器 */}
                  <div className="flex h-11 w-full min-w-[168px] flex-1 items-center gap-2 rounded-lg px-3 py-2.5">
                    <Label htmlFor="difficulty" className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                      <Image
                        src="/images/options-icon/difficulty.svg"
                        alt="Difficulty"
                        width={20}
                        height={20}
                        className="w-5 h-5 object-contain"
                        unoptimized={true}
                      />
                      <span>{t('difficulty')}</span>
                    </Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={handleDifficultyChange}
                    >
                      <SelectTrigger id="difficulty" className="ml-auto h-8 w-24 border-0 bg-background text-xs transition-colors duration-200 sm:w-28">
                        <SelectValue placeholder={t('selectDifficulty')} />
                      </SelectTrigger>
                      <SelectContent sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="z-50 border-border/70 bg-card text-foreground">
                        <SelectItem value="easy">{t('easy')}</SelectItem>
                        <SelectItem value="medium">{t('mediumDifficulty')}</SelectItem>
                        <SelectItem value="hard">{t('hard')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cuisine 选择器 */}
                  <div className="flex h-11 w-full min-w-[168px] flex-1 items-center gap-2 rounded-lg px-3 py-2.5">
                    <Label htmlFor="cuisine" className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                      <Image
                        src="/images/options-icon/cuisine.svg"
                        alt="Cuisine"
                        width={20}
                        height={20}
                        className="w-5 h-5 object-contain"
                        unoptimized={true}
                      />
                      <span>{t('cuisine')}</span>
                    </Label>
                    <Select
                      value={formData.cuisine}
                      onValueChange={handleCuisineChange}
                    >
                      <SelectTrigger id="cuisine" className="ml-auto h-8 w-24 border-0 bg-background text-xs transition-colors duration-200 sm:w-28">
                        <SelectValue placeholder={t('selectCuisine')} />
                      </SelectTrigger>
                      <SelectContent sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="z-50 border-border/70 bg-card text-foreground">
                        <SelectItem value="any">{t('anyCuisine')}</SelectItem>
                        {cuisinesLoading ? (
                          <SelectItem value="loading" disabled>{t('loadingCuisines')}</SelectItem>
                        ) : (
                          cuisines.map((cuisine) => (
                            <SelectItem key={cuisine.id} value={cuisine.id.toString()}>
                              {cuisine.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                </div>
              </div>

              {/* 下方：生成按钮（占整列） */}
              <div className="w-full">
                <Button
                  onClick={handleGenerateClick}
                  className={cn(
                    "min-h-[48px] w-full text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-[1.01]"
                  )}
                  size="sm"
                  disabled={loading || authLoading || formData.ingredients.length < 2}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>{loading ? t('generating') : t('generate')}</span>
                </Button>
              </div>
            </div>
          ) : (
            /* 移动端：垂直布局 */
            <div className="flex flex-col gap-4">
              {/* 选项面板（常显） */}
              <div className="flex w-full flex-col gap-3">
                {/* Servings 步进器 */}
                <div className="flex h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5">
                  <Label htmlFor="servings" className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                    <Image
                      src="/images/options-icon/serving.svg"
                      alt={t('servings')}
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                      unoptimized={true}
                    />
                    <span>{t('servings')}</span>
                  </Label>
                  <div className="flex items-center gap-1 rounded-md p-1 ml-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                      onClick={handleServingsDecrease}
                      disabled={formData.servings <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="w-6 px-1 text-center">
                      <span className="text-sm font-semibold text-foreground">{formData.servings}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                      onClick={handleServingsIncrease}
                      disabled={formData.servings >= 8}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Cooking Time 选择器 */}
                <div className="flex h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5">
                  <Label htmlFor="cookingTime" className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                    <Image
                      src="/images/options-icon/cooking_time.svg"
                      alt={t('cookingTime')}
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                      unoptimized={true}
                    />
                    <span>{t('cookingTime')}</span>
                  </Label>
                  <Select
                    value={formData.cookingTime}
                    onValueChange={handleCookingTimeChange}
                  >
                    <SelectTrigger id="cookingTime" className="ml-auto h-8 w-20 border-0 bg-background text-xs transition-colors duration-200 sm:w-24">
                      <SelectValue placeholder={t('selectCookingTime')} />
                    </SelectTrigger>
                    <SelectContent sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="z-50 border-border/70 bg-card text-foreground">
                      <SelectItem value="quick">{t('quick')}</SelectItem>
                      <SelectItem value="medium">{t('mediumTime')}</SelectItem>
                      <SelectItem value="long">{t('long')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty 选择器 */}
                <div className="flex h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5">
                  <Label htmlFor="difficulty" className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                    <Image
                      src="/images/options-icon/difficulty.svg"
                      alt="Difficulty"
                      width={16}
                      height={16}
                      className="w-4 h-4 object-contain"
                      unoptimized={true}
                    />
                    <span>{t('difficulty')}</span>
                  </Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={handleDifficultyChange}
                  >
                    <SelectTrigger id="difficulty" className="ml-auto h-8 w-20 border-0 bg-background text-xs transition-colors duration-200 sm:w-24">
                      <SelectValue placeholder={t('selectDifficulty')} />
                    </SelectTrigger>
                    <SelectContent sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="z-50 border-border/70 bg-card text-foreground">
                      <SelectItem value="easy">{t('easy')}</SelectItem>
                      <SelectItem value="medium">{t('mediumDifficulty')}</SelectItem>
                      <SelectItem value="hard">{t('hard')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Cuisine 选择器 */}
                <div className="flex h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5">
                  <Label htmlFor="cuisine" className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                    <Image
                      src="/images/options-icon/cuisine.svg"
                      alt="Cuisine"
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                      unoptimized={true}
                    />
                    <span>{t('cuisine')}</span>
                  </Label>
                  <Select
                    value={formData.cuisine}
                    onValueChange={handleCuisineChange}
                  >
                    <SelectTrigger id="cuisine" className="ml-auto h-8 w-20 border-0 bg-background text-xs transition-colors duration-200 sm:w-24">
                      <SelectValue placeholder={t('selectCuisine')} />
                    </SelectTrigger>
                    <SelectContent sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="z-50 border-border/70 bg-card text-foreground">
                      <SelectItem value="any">{t('anyCuisine')}</SelectItem>
                      {cuisinesLoading ? (
                        <SelectItem value="loading" disabled>{t('loadingCuisines')}</SelectItem>
                      ) : (
                        cuisines.map((cuisine) => (
                          <SelectItem key={cuisine.id} value={cuisine.id.toString()}>
                            {cuisine.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 生成按钮 */}
              <div className="flex justify-center">
                <Button
                  onClick={handleGenerateClick}
                  className={cn(
                    "min-h-[48px] w-full text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/30"
                  )}
                  size="sm"
                  disabled={loading || authLoading || formData.ingredients.length < 2}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {loading ? (
                    <span>{t('generating')}</span>
                  ) : (
                    <span>{t('generate')}</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 登录模态框 */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}; 
