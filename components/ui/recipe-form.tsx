"use client"

import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useMemo } from "react";
import { IngredientSelector } from "./ingredients-selector";
import { Sliders, Sparkles, X, RotateCcw, Search, Minus, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthModal } from "@/components/auth/auth-modal";
import { cn } from "@/lib/utils";
import { useCuisines } from "@/hooks/use-cuisines";
import { useTranslations, useLocale } from 'next-intl';
import { RecipeFormData, Ingredient } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Input } from "@/components/ui/input";
import { generateNanoId } from '@/lib/utils/id-generator';
import Image from "next/image";
import { CATEGORIES_CONFIG, CAROUSEL_CONFIG, SEARCH_CONFIG } from '@/lib/config';

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

// 自定义 Hook: 搜索状态管理
const useSearchState = () => {
  const [searchValue, setSearchValue] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);

  const clearSearchState = useCallback(() => {
    setSearchValue('');
    setShowSearchResults(false);
    setSearchResults([]);
  }, []);

  const toggleSearch = useCallback(() => {
    setShowSearchInput(prev => !prev);
  }, []);

  const closeSearch = useCallback(() => {
    setShowSearchInput(false);
    clearSearchState();
  }, [clearSearchState]);

  return {
    searchValue,
    setSearchValue,
    showSearchInput,
    setShowSearchInput,
    showSearchResults,
    setShowSearchResults,
    searchResults,
    setSearchResults,
    clearSearchState,
    toggleSearch,
    closeSearch,
  };
};

// 自定义 Hook: 食材操作管理
const useIngredientsActions = (formData: RecipeFormData, onFormChange: (data: RecipeFormData) => void) => {
  const addIngredient = useCallback((ingredient: Ingredient) => {
    const isAlreadySelected = formData.ingredients.some(
      selected => selected.id === ingredient.id
    );
    
    if (!isAlreadySelected) {
      onFormChange({
        ...formData,
        ingredients: [...formData.ingredients, ingredient]
      });
    }
  }, [formData, onFormChange]);

  const removeIngredient = useCallback((ingredientId: string) => {
    onFormChange({
      ...formData,
      ingredients: formData.ingredients.filter(item => item.id !== ingredientId)
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

export const RecipeForm = ({
  formData,
  onFormChange,
  onSubmit,
  loading,
  setShowRecipe,
}: RecipeFormProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { cuisines, loading: cuisinesLoading } = useCuisines();
  const t = useTranslations('recipeForm');
  const tIngredientSelector = useTranslations('ingredientSelector');
  const locale = useLocale();
  
  // 使用自定义 hooks
  const { isMobile } = useResponsive();
  const searchState = useSearchState();
  const { addIngredient, removeIngredient, clearIngredients } = useIngredientsActions(formData, onFormChange);
  
  // 分类相关状态
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES_CONFIG>('meat');
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, { name: string; icon?: string; color?: string }>>({});
  
  // 新增：搜索相关状态
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(true);
  const [ingredientsError, setIngredientsError] = useState<string | null>(null);
  
  // 新增：选项面板显示状态
  const [showOptions, setShowOptions] = useState(true);

  // 处理分类变更 - 使用 useCallback 优化
  const handleCategoryChange = useCallback((categoryId: keyof typeof CATEGORIES_CONFIG) => {
    setActiveCategory(categoryId);
  }, []);

  // 获取食材数据的函数 - 提取为可复用函数
  const fetchIngredientsData = useCallback(async () => {
    setIngredientsLoading(true);
    setIngredientsError(null);
    
    try {
      const response = await fetch(`/api/ingredients?lang=${locale}&limit=200`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.results) {
        setAllIngredients(data.results);
      } else {
        throw new Error(data.message || '获取食材数据失败');
      }
    } catch (error) {
      console.error("获取食材失败", error);
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
        const data = await response.json();

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
        console.error("获取分类失败", error);
      }
    };
    fetchCategories();
  }, [locale]);

  // 处理搜索框展开/收起 - 使用 useCallback 优化
  const handleSearchIconClick = useCallback(() => {
    searchState.toggleSearch();
    // 如果关闭搜索框，清空搜索内容和状态
    if (searchState.showSearchInput) {
      searchState.clearSearchState();
    }
  }, [searchState]);

  // 处理搜索框关闭 - 使用 useCallback 优化
  const handleSearchClose = useCallback(() => {
    searchState.closeSearch();
  }, [searchState]);

  // 检测屏幕尺寸 - 已移至 useResponsive hook

  // 监听showLoginModal事件
  useEffect(() => {
    const handleShowLoginModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener('showLoginModal', handleShowLoginModal);
    return () => window.removeEventListener('showLoginModal', handleShowLoginModal);
  }, []);

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
    // 允许未登录用户生成菜谱，移除所有积分检查
    if (formData.ingredients.length >= 2) {
      onSubmit();
      setShowRecipe(true); // 设置显示菜谱结果

      // 确保在DOM更新后执行滚动，使用更平滑的方式
      setTimeout(() => {
        const loadingElement = document.getElementById('loading-animation-container');
        if (loadingElement) {
          const elementRect = loadingElement.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const middle = absoluteElementTop - (window.innerHeight / 2);
          
          window.scrollTo({
            top: middle,
            behavior: 'smooth'
          });
        }
      }, SEARCH_CONFIG.SCROLL_DELAY);
    }
  }, [formData.ingredients.length, onSubmit, setShowRecipe]);

  // 处理搜索结果选择 - 使用 useCallback 优化（提前声明）
  const handleSearchResultSelect = useCallback((ingredient: Ingredient) => {
    addIngredient(ingredient);
    searchState.clearSearchState();
  }, [addIngredient, searchState]);

  // 处理搜索输入变更 - 使用 useCallback 优化
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    searchState.setSearchValue(value);
    
    if (value.trim()) {
      // 实时搜索逻辑 - 支持以输入内容开头的匹配
      const searchTerm = value.toLowerCase().trim();
      const filtered = allIngredients.filter(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();
        return ingredientName.startsWith(searchTerm) && 
               !formData.ingredients.some(selected => selected.id === ingredient.id);
      });
      
      // 按相关性排序：完全匹配 > 开头匹配 > 包含匹配
      const sortedResults = filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // 完全匹配优先
        if (aName === searchTerm && bName !== searchTerm) return -1;
        if (bName === searchTerm && aName !== searchTerm) return 1;
        
        // 按字母顺序排序
        return aName.localeCompare(bName);
      });
      
      const finalResults = sortedResults.slice(0, SEARCH_CONFIG.MAX_RESULTS); // 限制显示数量
      searchState.setSearchResults(finalResults);
      searchState.setShowSearchResults(true);
    } else {
      searchState.setShowSearchResults(false);
      searchState.setSearchResults([]);
    }
  }, [searchState, allIngredients, formData.ingredients]);

  // 处理搜索键盘事件 - 使用 useCallback 优化
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchState.searchValue.trim()) {
      e.preventDefault();
      
      // 如果有搜索结果，选择第一个结果
      if (searchState.searchResults.length > 0) {
        handleSearchResultSelect(searchState.searchResults[0]);
        return;
      }
      
      // 如果没有找到匹配的食材，添加为自定义食材
      const trimmedValue = searchState.searchValue.trim();
      // 检查是否已经存在相同名称的食材
      const existingIngredient = formData.ingredients.find(
        ingredient => ingredient.name.toLowerCase() === trimmedValue.toLowerCase()
      );
      
      if (!existingIngredient) {
        const customIngredient: Ingredient = {
          id: generateNanoId(),
          name: trimmedValue,
          isCustom: true
        };
        addIngredient(customIngredient);
      }
      
      searchState.clearSearchState();
    } else if (e.key === 'Escape') {
      handleSearchClose();
    } else if (e.key === 'ArrowDown' && searchState.showSearchResults && searchState.searchResults.length > 0) {
      // 可选：支持方向键导航（暂时注释，如需要可启用）
      e.preventDefault();
    } else if (e.key === 'ArrowUp' && searchState.showSearchResults && searchState.searchResults.length > 0) {
      // 可选：支持方向键导航（暂时注释，如需要可启用）
      e.preventDefault();
    }
  }, [searchState, formData.ingredients, addIngredient, handleSearchResultSelect, handleSearchClose]);

  // 处理搜索框失焦 - 使用 useCallback 优化
  const handleSearchBlur = useCallback(() => {
    // 延迟隐藏搜索结果，避免点击事件冲突
    setTimeout(() => {
      searchState.setShowSearchResults(false);
    }, SEARCH_CONFIG.BLUR_DELAY);
  }, [searchState]);

  // 处理选项面板切换
  const handleOptionsToggle = useCallback(() => {
    setShowOptions(!showOptions);
  }, [showOptions]);

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

  return (
    <div className="w-full flex flex-col gap-2 sm:gap-3">
      {/* Recipe Maker 标题栏 - 最顶部 */}
      <div className={cn(
        "pb-2 pt-1",
        isMobile
          ? "flex flex-col gap-5 px-4"
          : "flex justify-between items-center"
      )}>
        {/* 标题栏 */}
        <div className={cn(
          "flex items-center",
          isMobile ? "flex-col gap-3 text-center" : ""
        )}>
          <div className={cn(
            "relative group",
            isMobile ? "max-w-xs" : "max-w-md"
          )}>
            {/* 主标题 */}
            <h2 className={cn(
              "relative z-10 font-bold text-secondary leading-relaxed px-4 py-2 rounded-2xl transition-all duration-300",
              isMobile ? "text-xl" : "text-lg"
            )}>
              {t('mainTitle')}
            </h2>
          </div>
        </div>

        {/* 搜索按钮 - 右侧 */}
        <TooltipProvider>
          <div className={cn(
            "relative flex items-center",
            isMobile ? "w-full justify-center" : ""
          )}>
            {/* 搜索按钮 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSearchIconClick}
                  className={cn(
                    "flex items-center justify-center transition-all duration-200 relative z-10 px-3 min-w-[60px] max-w-[60px] hover:scale-105",
                    isMobile ? "h-12 w-12" : "h-12",
                    searchState.showSearchInput
                      ? "bg-primary text-primary-foreground rounded-l-full shadow-lg shadow-[--color-primary-25]"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full hover:shadow-md"
                  )}
                >
                  <Search className={cn(
                    "shrink-0 transition-colors duration-300",
                    isMobile ? "h-5 w-5" : "h-5 w-5"
                  )} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                <p>{tIngredientSelector('searchIconTooltip')}</p>
              </TooltipContent>
            </Tooltip>

            {/* 抽屉式搜索框 - 从按钮右侧边缘展开 */}
            <div
              className={cn(
                "bg-white dark:bg-gray-800 border border-l-0 rounded-r-full overflow-hidden transition-all duration-300 ease-out relative shadow-lg",
                isMobile ? "h-12" : "h-12",
                searchState.showSearchInput
                  ? (isMobile ? "w-full opacity-100" : "w-[260px] opacity-100")
                  : "w-0 opacity-0"
              )}
            >
              <div className="relative h-full flex items-center">
                <Input
                  type="text"
                  placeholder={formData.ingredients.length > 0 ? tIngredientSelector('addMoreIngredients') : tIngredientSelector('selectOrEnterIngredients')}
                  className={cn(
                    "h-full pl-4 pr-4 border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                    isMobile ? "text-sm" : "text-sm"
                  )}
                  value={searchState.searchValue}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onBlur={handleSearchBlur}
                />
              </div>
            </div>

            {/* 搜索结果下拉框 */}
            {searchState.showSearchInput && searchState.showSearchResults && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2">
                <div
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl shadow-[--color-gray-200-40] dark:shadow-[--color-gray-900-40] overflow-hidden w-full"
                  style={{
                    minHeight: '200px',
                  }}
                >
                  {/* 搜索结果标题 */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {tIngredientSelector('searchResults')}
                    </h3>
                  </div>

                  {searchState.searchResults.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto">
                      {searchState.searchResults.map((ingredient, index) => (
                        <button
                          key={ingredient.id}
                          onClick={() => handleSearchResultSelect(ingredient)}
                          className="w-full px-4 py-3 text-left hover:bg-linear-to-r hover:from-[--color-primary-5] hover:to-[--color-primary-10] dark:hover:from-[--color-primary-10] dark:hover:to-[--color-primary-5] transition-all duration-200 border-b border-[--color-gray-100-50] dark:border-[--color-gray-700-50] last:border-b-0 group"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary dark:group-hover:text-primary transition-colors duration-200">
                                {ingredient.name}
                              </span>
                            </div>
                            {ingredient.category && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-medium">
                                {ingredient.category.name}
                              </span>
                            )}
                          </div>

                        </button>
                      ))}
                    </div>
                  ) : searchState.searchValue.trim() ? (
                    <div>
                      {/* 空状态标题 */}
                      <div className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <span className="text-2xl">🔍</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {tIngredientSelector('noMatchingIngredientsFound')}
                        </p>
                      </div>
                      {/* 底部提示 */}
                      <div className="bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-4 py-3">
                        <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                          <div className="w-4 h-4 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                            <span className="text-[10px] font-bold">+</span>
                          </div>
                          <span>{tIngredientSelector('pressEnterToAddCustomIngredient')}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </TooltipProvider>
      </div>

      {/* 食材选择与输入集成区域 */}
      <div className={cn("gap-4", isMobile ? "flex flex-col gap-5 px-4" : "flex")}>
        {/* 左侧：食材分类tab和食材选择器 */}
        <div className={cn("flex flex-col", isMobile ? "w-full" : "flex-1")}>
          <div className="relative flex-1 min-h-0">
            {/* 左侧背景主体 */}
            <div className={cn(
              "bg-white dark:bg-gray-900 rounded-2xl flex flex-col shadow-md border border-gray-200 dark:border-gray-700",
              isMobile ? "p-4 h-[420px]" : "p-6 h-[400px]"
            )}>


              {/* 食材分类tab - 固定高度 */}
              <div className="shrink-0 mb-3">
                {!isMobile ? (
                  <TooltipProvider>
                    <div className="w-full">
                      <div className="flex items-center justify-between pb-1">
                        {/* 分类tab */}
                        <div className="flex items-center gap-1 flex-1">
                          {Object.entries(CATEGORIES_CONFIG).map(([categoryId, category]) => {
                            const Icon = category.icon;
                            const isActive = activeCategory === categoryId;
                            // 优先使用动态获取的分类名称，如果没有则使用翻译作为备用
                            const categoryName = dynamicCategories[categoryId]?.name || tIngredientSelector(`categories.${categoryId}`);

                            return (
                              <Tooltip key={categoryId}>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleCategoryChange(categoryId as keyof typeof CATEGORIES_CONFIG)}
                                    className={cn(
                                      "flex items-center justify-center transition-all duration-300 relative group h-12 flex-1 cursor-pointer",
                                      isActive
                                        ? "bg-linear-to-r from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-700 text-white shadow-lg shadow-orange-500/30 dark:shadow-orange-600/40 scale-105 rounded-2xl px-2 gap-2"
                                        : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105 rounded-xl p-2 gap-2"
                                    )}
                                  >
                                    {/* 选中状态的背景装饰 */}
                                    {isActive && (
                                      <div className="absolute inset-0 bg-linear-to-r from-orange-500/10 to-amber-600/10 dark:from-orange-600/15 dark:to-amber-700/15 rounded-2xl" />
                                    )}

                                    <span className={cn(
                                      "h-5 w-5 shrink-0 transition-all duration-300 relative z-10",
                                      isActive ? "text-white drop-shadow-xs" : category.color,
                                      !isActive && "group-hover:scale-125"
                                    )}>
                                      {Icon}
                                    </span>

                                    {isActive && (
                                      <span className="text-sm font-semibold whitespace-nowrap relative z-10 drop-shadow-xs">
                                        {categoryName}
                                      </span>
                                    )}


                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                  <p>{categoryName}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </TooltipProvider>
                ) : (
                  <div className="w-full mb-3 space-y-2">
                    {/* 分类选择器 */}
                    <Select
                      value={activeCategory}
                      onValueChange={(value) => handleCategoryChange(value as keyof typeof CATEGORIES_CONFIG)}
                    >
                      <SelectTrigger className="w-full h-11 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-xs hover:border-orange-500/50 focus:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 cursor-pointer">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            {CATEGORIES_CONFIG[activeCategory] && (() => {
                              const Icon = CATEGORIES_CONFIG[activeCategory].icon;
                              return <span className={cn("h-5 w-5 shrink-0", CATEGORIES_CONFIG[activeCategory].color)}>{Icon}</span>;
                            })()}
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {dynamicCategories[activeCategory]?.name || tIngredientSelector(`categories.${activeCategory}`)}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-700 rounded-xl shadow-lg">
                        {Object.entries(CATEGORIES_CONFIG).map(([categoryId, category]) => {
                          const Icon = category.icon;
                          const isActive = activeCategory === categoryId;

                          return (
                            <SelectItem
                              key={categoryId}
                              value={categoryId}
                              hideIndicator={true}
                              className={cn(
                                "flex items-center gap-3 py-3 px-4 cursor-pointer transition-all duration-200",
                                isActive
                                  ? "bg-linear-to-r from-orange-500/10 to-amber-500/10 text-orange-600 dark:text-orange-400 font-semibold border-l-2 border-orange-500"
                                  : "hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400"
                              )}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <span className={cn("h-5 w-5 shrink-0", category.color)}>{Icon}</span>
                                <span className="font-medium text-sm">
                                  {dynamicCategories[categoryId]?.name || tIngredientSelector(`categories.${categoryId}`)}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>


                  </div>
                )}
              </div>

              {/* 食材选择器 - 占据剩余高度 */}
              <div className="flex-1 min-h-0">
                {ingredientsLoading ? (
                  // Loading 状态
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      {/* Loading 动画 */}
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-[--color-primary-30] rounded-full animate-ping"></div>
                      </div>
                      
                      {/* Loading 文字 */}
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {tIngredientSelector('loadingIngredients') || '正在加载食材...'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : ingredientsError ? (
                  // 错误状态
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-4 max-w-xs text-center">
                      {/* 错误图标 */}
                      <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      
                      {/* 错误信息 */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {tIngredientSelector('loadError') || '加载失败'}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                          {ingredientsError}
                        </p>
                        
                        {/* 重试按钮 */}
                        <button
                          onClick={fetchIngredientsData}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-[--color-primary-90] transition-colors duration-200"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {tIngredientSelector('retry') || '重试'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 正常状态 - 显示食材选择器
                  <IngredientSelector
                    selectedIngredients={formData.ingredients}
                    onIngredientSelect={addIngredient}
                    onIngredientRemove={(ingredient) => removeIngredient(ingredient.id.toString())}
                    activeCategory={activeCategory}
                    onCategoryChange={handleCategoryChange}
                    allIngredients={allIngredients}
                    dynamicCategories={dynamicCategories}
                  />
                )}
              </div>

              {/* 左侧底部装饰 */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-500 to-transparent rounded-full"></div>
            </div>

            {/* 左侧阴影效果 */}
            <div className="absolute -bottom-2 left-2 right-2 h-2 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent rounded-full blur-sm"></div>
          </div>
        </div>



        {/* 右侧：已选食材 - 餐饮小票样式 */}
        <div className={cn(isMobile ? "w-full" : "w-80 flex flex-col")}>
          <div className="relative">
            {/* 小票主体 */}
            <div className={cn(
              "bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-[--color-gray-200-50] dark:shadow-[--color-gray-900-50] flex flex-col border-2 border-gray-200 dark:border-gray-700",
              isMobile ? "p-4 h-[380px]" : "p-6 h-[400px]"
            )}>
              {/* 小票顶部装饰 - 模拟小票撕口 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-2 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-500 to-transparent rounded-full"></div>

              {/* 小票头部信息 */}
              <div className="mb-4 pb-3 border-b-2 border-dashed border-gray-300 dark:border-gray-600">
                                  <div className={cn(
                    "flex items-center",
                    isMobile ? "justify-center" : "justify-between"
                  )}>
                    <div className={cn(
                      "flex items-center gap-2",
                      isMobile ? "justify-center" : "flex-1"
                    )}>
                      <div className={cn(
                        "flex items-center justify-center",
                        isMobile ? "w-6 h-6" : "w-8 h-8"
                      )}>
                        <span className={cn(
                          "text-gray-700 dark:text-gray-300",
                          isMobile ? "text-base" : "text-lg"
                        )}>🧺</span>
                      </div>
                      <h3 className={cn(
                        "font-bold text-gray-900 dark:text-gray-100 font-mono",
                        isMobile ? "text-base" : "text-lg"
                      )}>
                        {t('basket')}
                        {formData.ingredients.length > 0 && (
                          <span className="ml-2 text-gray-600 dark:text-gray-400 font-normal">
                            ({formData.ingredients.length})
                          </span>
                        )}
                      </h3>
                    </div>

                  {/* Reset按钮 - 只在有食材时显示 */}
                  {formData.ingredients.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={clearIngredients}
                            className={cn(
                              "flex items-center justify-center transition-all duration-300 hover:scale-105",
                              isMobile ? "w-8 h-8" : "w-9 h-9"
                            )}
                          >
                            <RotateCcw className={cn(
                              "text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400",
                              isMobile ? "h-4 w-4" : "h-4 w-4"
                            )} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                          <p>{t('reset')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              {/* 食材列表 - 小票格式 */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {formData.ingredients.length === 0 ? (
                  <div className="text-center py-6">
                    <div className={cn(
                      "mx-auto flex items-center justify-center mb-2",
                      isMobile ? "w-10 h-10" : "w-16 h-16"
                    )}>
                      <span className={cn(
                        isMobile ? "text-lg" : "text-2xl"
                      )}>📝</span>
                    </div>
                    <p className={cn(
                      "text-gray-500 dark:text-gray-400 font-medium font-mono",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      {t('noIngredients')}
                    </p>
                    <p className={cn(
                      "text-gray-400 dark:text-gray-500 mt-1 font-mono",
                      isMobile ? "text-xs" : "text-xs"
                    )}>
                      {t('selectFromLeftPanel')}
                    </p>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto custom-scrollbar pr-1">
                    {/* 小票列表头部 */}
                    <div className="px-3 py-2 border-b border-dashed border-gray-300 dark:border-gray-600 mb-3">
                      <div className="flex text-xs text-gray-500 dark:text-gray-400 font-mono">
                        <span className="w-8 text-center">{t('itemNumber')}</span>
                        <span className="ml-6">{t('itemName')}</span>
                      </div>
                    </div>

                    {formData.ingredients.map((ingredient, index) => {
                      // 构建图标路径
                      const iconPath = ingredient.slug
                        ? `/images/ingredients-icon/${ingredient.slug}.svg`
                        : null;

                      return (
                        <div key={ingredient.id}>
                          <div className={cn(
                            "group flex items-center py-2.5 transition-all duration-200",
                            isMobile ? "px-3" : "px-3"
                          )}>
                            {/* 序号列 */}
                            <span className="text-gray-400 dark:text-gray-500 text-xs font-mono font-bold w-8 text-center">
                              {String(index + 1).padStart(2, '0')}
                            </span>

                            {/* 食材信息列 */}
                            <div className="flex items-center gap-3 flex-1 min-w-0 ml-6">
                              {/* 食材图标 */}
                              {iconPath && (
                                <div className="shrink-0">
                                  <Image
                                    src={iconPath}
                                    alt={ingredient.name}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 object-contain transition-transform duration-200 group-hover:scale-110"
                                    onError={(e) => {
                                      // 如果图标加载失败，隐藏图标元素
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={cn(
                                      "text-gray-900 dark:text-gray-100 font-medium truncate font-mono cursor-help",
                                      isMobile ? "text-sm" : "text-sm"
                                    )}>
                                      {ingredient.name.toUpperCase()}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                    <p className="font-mono">{ingredient.name.toUpperCase()}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>

                            {/* 删除按钮 */}
                            <button
                              onClick={() => removeIngredient(ingredient.id.toString())}
                              className={cn(
                                "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 ml-auto",
                                isMobile ? "p-1.5" : "p-1.5"
                              )}
                            >
                              <X className={cn(
                                isMobile ? "h-4 w-4" : "h-4 w-4"
                              )} />
                            </button>
                          </div>
                          {index < formData.ingredients.length - 1 && (
                            <div className="border-b border-dashed border-gray-200 dark:border-gray-600 mx-3" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 生成按钮和高级设置 */}
      <div className={cn(
        "pt-2 pb-4",
        isMobile ? "px-4" : ""
      )}>
        {/* 内容容器 */}
        <div className={cn(
          "w-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
          "shadow-xs hover:shadow-md transition-all duration-300",
          "p-4"
        )}>
          {/* 桌面端：使用网格布局，左侧选项，右侧按钮 */}
          {!isMobile ? (
            <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
              {/* 左侧：高级设置选项 */}
              <div className="flex items-center flex-nowrap gap-3">
                {/* 选项图标按钮 - 默认显示 */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleOptionsToggle}
                        className={cn(
                          "flex items-center justify-center transition-all duration-200 group relative",
                          showOptions
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700",
                          "rounded-full p-2 h-10 w-10"
                        )}
                      >
                        <Sliders className={cn(
                          "h-4 w-4 transition-transform duration-300",
                          showOptions ? "rotate-90" : "group-hover:rotate-45"
                        )} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <p>{showOptions ? t('hideOptions') || '隐藏选项' : t('showOptions') || '显示选项'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* 抽屉式选项面板 - 向右弹出 */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-500 ease-out",
                    "flex flex-nowrap items-center gap-3",
                    showOptions
                      ? "h-auto opacity-100"
                      : "h-0 opacity-0"
                  )}
                  style={{
                    transform: showOptions ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left center'
                  }}
                >
                {/* Servings 步进器 */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full sm:w-auto sm:min-w-[140px] border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="servings" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="text-base">👥</span>
                    <span>{t('servings')}</span>
                  </Label>
                  <div className="flex items-center gap-1 rounded-md p-1 ml-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                      onClick={handleServingsDecrease}
                      disabled={formData.servings <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="w-6 text-center px-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formData.servings}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                      onClick={handleServingsIncrease}
                      disabled={formData.servings >= 8}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Cooking Time 选择器 */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full sm:w-auto sm:min-w-[140px] border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="cookingTime" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="text-base">⏱️</span>
                    <span>{t('cookingTime')}</span>
                  </Label>
                  <Select
                    value={formData.cookingTime}
                    onValueChange={handleCookingTimeChange}
                  >
                    <SelectTrigger id="cookingTime" className="h-8 w-20 sm:w-24 text-xs bg-gray-50 dark:bg-gray-700 border-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ml-auto">
                      <SelectValue placeholder={t('selectCookingTime')} />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <SelectItem value="quick">{t('quick')}</SelectItem>
                      <SelectItem value="medium">{t('mediumTime')}</SelectItem>
                      <SelectItem value="long">{t('long')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty 选择器 */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full sm:w-auto sm:min-w-[140px] border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="difficulty" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="text-base">🎚️</span>
                    <span>{t('difficulty')}</span>
                  </Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={handleDifficultyChange}
                  >
                    <SelectTrigger id="difficulty" className="h-8 w-20 sm:w-24 text-xs bg-gray-50 dark:bg-gray-700 border-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ml-auto">
                      <SelectValue placeholder={t('selectDifficulty')} />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <SelectItem value="easy">{t('easy')}</SelectItem>
                      <SelectItem value="medium">{t('mediumDifficulty')}</SelectItem>
                      <SelectItem value="hard">{t('hard')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Cuisine 选择器 */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full sm:w-auto sm:min-w-[140px] border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="cuisine" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="text-base">🌎</span>
                    <span>{t('cuisine')}</span>
                  </Label>
                  <Select
                    value={formData.cuisine}
                    onValueChange={handleCuisineChange}
                  >
                    <SelectTrigger id="cuisine" className="h-8 w-20 sm:w-24 text-xs bg-gray-50 dark:bg-gray-700 border-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ml-auto">
                      <SelectValue placeholder={t('selectCuisine')} />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
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

              {/* 右侧：生成按钮 */}
              <div className="flex items-center shrink-0">
                <Button
                  onClick={handleGenerateClick}
                  className={cn(
                    "font-medium transition-all duration-300 hover:scale-105",
                    "px-3 sm:px-6"
                  )}
                  size="sm"
                  disabled={loading || formData.ingredients.length < 2}
                >
                  <Sparkles className={cn(
                    "transition-all duration-300",
                    "h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4"
                  )} />
                  {loading ? (
                    <span className="hidden sm:inline">{t('generating')}</span>
                  ) : (
                    <span className="hidden sm:inline">{t('generate')}</span>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* 移动端：垂直布局 */
            <div className="flex flex-col gap-4">
              {/* 选项图标按钮 */}
              <div className="flex justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleOptionsToggle}
                        className={cn(
                          "flex items-center justify-center transition-all duration-200 group relative",
                          showOptions
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700",
                          "rounded-full p-2 h-10 w-10"
                        )}
                      >
                        <Sliders className={cn(
                          "h-4 w-4 transition-transform duration-300",
                          showOptions ? "rotate-90" : "group-hover:rotate-45"
                        )} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <p>{showOptions ? t('hideOptions') || '隐藏选项' : t('showOptions') || '显示选项'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* 抽屉式选项面板 - 向下展开 */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-500 ease-out",
                  "flex flex-col gap-3 w-full",
                  showOptions
                    ? "h-auto opacity-100"
                    : "h-0 opacity-0"
                )}
                style={{
                  transform: showOptions ? 'scaleY(1)' : 'scaleY(0)',
                  transformOrigin: 'top center'
                }}
              >
                {/* Servings 步进器 */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="servings" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="text-base">👥</span>
                    <span>{t('servings')}</span>
                  </Label>
                  <div className="flex items-center gap-1 rounded-md p-1 ml-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                      onClick={handleServingsDecrease}
                      disabled={formData.servings <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="w-6 text-center px-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formData.servings}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                      onClick={handleServingsIncrease}
                      disabled={formData.servings >= 8}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Cooking Time 选择器 */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="cookingTime" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="text-base">⏱️</span>
                    <span>{t('cookingTime')}</span>
                  </Label>
                  <Select
                    value={formData.cookingTime}
                    onValueChange={handleCookingTimeChange}
                  >
                    <SelectTrigger id="cookingTime" className="h-8 w-20 sm:w-24 text-xs bg-gray-50 dark:bg-gray-700 border-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ml-auto">
                      <SelectValue placeholder={t('selectCookingTime')} />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <SelectItem value="quick">{t('quick')}</SelectItem>
                      <SelectItem value="medium">{t('mediumTime')}</SelectItem>
                      <SelectItem value="long">{t('long')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty 选择器 */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="difficulty" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="text-base">🎚️</span>
                    <span>{t('difficulty')}</span>
                  </Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={handleDifficultyChange}
                  >
                    <SelectTrigger id="difficulty" className="h-8 w-20 sm:w-24 text-xs bg-gray-50 dark:bg-gray-700 border-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ml-auto">
                      <SelectValue placeholder={t('selectDifficulty')} />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      <SelectItem value="easy">{t('easy')}</SelectItem>
                      <SelectItem value="medium">{t('mediumDifficulty')}</SelectItem>
                      <SelectItem value="hard">{t('hard')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Cuisine 选择器 */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full border border-gray-100 dark:border-gray-700">
                  <Label htmlFor="cuisine" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="text-base">🌎</span>
                    <span>{t('cuisine')}</span>
                  </Label>
                  <Select
                    value={formData.cuisine}
                    onValueChange={handleCuisineChange}
                  >
                    <SelectTrigger id="cuisine" className="h-8 w-20 sm:w-24 text-xs bg-gray-50 dark:bg-gray-700 border-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ml-auto">
                      <SelectValue placeholder={t('selectCuisine')} />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
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
                    "font-medium transition-all duration-300 hover:scale-105",
                    "w-full h-14 text-lg shadow-lg shadow-[text-primary-25] hover:shadow-xl hover:shadow-[text-primary-30]"
                  )}
                  size="sm"
                  disabled={loading || formData.ingredients.length < 2}
                >
                  <Sparkles className="h-5 w-5 mr-2 transition-all duration-300" />
                  {loading ? (
                    <span className="sm:hidden">{t('wait')}</span>
                  ) : (
                    <span className="sm:hidden">{t('go')}</span>
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