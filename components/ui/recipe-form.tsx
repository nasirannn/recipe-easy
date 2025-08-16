"use client"

import { Button } from "@/components/ui/button";
import { useState, useEffect, } from "react";
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

// 分类图标映射 - 与数据库slug对应
const CATEGORIES = {
  meat: { icon: '🥩', color: 'text-red-600' },
  seafood: { icon: '🐟', color: 'text-blue-600' },
  vegetables: { icon: '🥬', color: 'text-green-600' },
  fruits: { icon: '🍎', color: 'text-yellow-600' },
  'dairy-eggs': { icon: '🥚', color: 'text-purple-600' },
  'grains-bread': { icon: '🌾', color: 'text-amber-600' },
  'nuts-seeds': { icon: '🌰', color: 'text-orange-600' },
  'herbs-spices': { icon: '🌿', color: 'text-emerald-600' },
} as const;

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

export const RecipeForm = ({
  formData,
  onFormChange,
  onSubmit,
  loading,
  setShowRecipe,
  // 新增：tab相关props
  activeTab = 'recipe-maker',
  onTabChange,
  mealPlannerText = '',
  onMealPlannerTextChange,
  onMealPlannerClear,
  onMealPlannerSubmit,
}: RecipeFormProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const { cuisines, loading: cuisinesLoading } = useCuisines();
  const t = useTranslations('recipeForm');
  const tIngredientSelector = useTranslations('ingredientSelector');
  const locale = useLocale();
  
  // 分类相关状态
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES>('meat');
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, { name: string; icon?: string; color?: string }>>({});
  const [searchValue, setSearchValue] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  
  // 新增：搜索相关状态
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  
  // 新增：选项面板显示状态
  const [showOptions, setShowOptions] = useState(true);

  // 处理分类变更
  const handleCategoryChange = (categoryId: keyof typeof CATEGORIES) => {
    setActiveCategory(categoryId);
  };

  // 新增：获取所有食材数据
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetch(`/api/ingredients?lang=${locale}&limit=200`);
        const data = await response.json();
        if (data.success && data.results) {
          setAllIngredients(data.results);
        }
      } catch (error) {
        console.error("获取食材失败", error);
      }
    };
    
    fetchIngredients();
  }, [locale]);

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
            const categoryKey = category.slug as keyof typeof CATEGORIES;
            if (CATEGORIES[categoryKey]) {
              categoriesMap[categoryKey] = {
                name: category.name,
                icon: CATEGORIES[categoryKey].icon,
                color: CATEGORIES[categoryKey].color
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

  // 处理搜索框展开/收起
  const handleSearchIconClick = () => {
    setShowSearchInput(!showSearchInput);
    // 如果关闭搜索框，清空搜索内容和状态
    if (showSearchInput) {
      setSearchValue('');
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  // 处理搜索框关闭
  const handleSearchClose = () => {
    setShowSearchInput(false);
    setSearchValue('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // 初始检查
    checkMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 监听showLoginModal事件
  useEffect(() => {
    const handleShowLoginModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener('showLoginModal', handleShowLoginModal);
    return () => window.removeEventListener('showLoginModal', handleShowLoginModal);
  }, []);

  // 轮播自动播放
  useEffect(() => {
    const carousel = document.getElementById('meal-planner-carousel');
    if (!carousel) return;

    let currentIndex = 0;
    const totalItems = 6; // 实际内容数量
    const interval = setInterval(() => {
      currentIndex++;
      
      // 当到达重复的第一个元素时，重置到真正的第一个元素
      if (currentIndex >= totalItems) {
        // 等待过渡动画完成后，无动画地重置位置
        setTimeout(() => {
          carousel.style.transition = 'none';
          carousel.style.transform = 'translateY(0px)';
          currentIndex = 0;
          
          // 恢复过渡动画
          setTimeout(() => {
            carousel.style.transition = 'transform 1s ease-in-out';
          }, 10);
        }, 1000); // 等待1秒让过渡动画完成
      } else {
        carousel.style.transform = `translateY(-${currentIndex * 32}px)`; // 32px = h-8
      }
    }, 3000); // 每3秒切换一次

    return () => clearInterval(interval);
  }, []);

  // 处理生成按钮点击
  const handleGenerateClick = () => {
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
      }, 150);
    }
  };

  // 处理搜索输入变更
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
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
      
      const finalResults = sortedResults.slice(0, 8); // 限制显示数量
      setSearchResults(finalResults);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  // 处理搜索键盘事件
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      e.preventDefault();
      
      // 如果有搜索结果，选择第一个结果
      if (searchResults.length > 0) {
        handleSearchResultSelect(searchResults[0]);
        return;
      }
      
      // 如果没有找到匹配的食材，添加为自定义食材
      const trimmedValue = searchValue.trim();
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
        onFormChange({
          ...formData,
          ingredients: [...formData.ingredients, customIngredient]
        });
      }
      
      setSearchValue('');
      setShowSearchResults(false);
    } else if (e.key === 'Escape') {
      handleSearchClose();
    } else if (e.key === 'ArrowDown' && showSearchResults && searchResults.length > 0) {
      // 可选：支持方向键导航（暂时注释，如需要可启用）
      e.preventDefault();
    } else if (e.key === 'ArrowUp' && showSearchResults && searchResults.length > 0) {
      // 可选：支持方向键导航（暂时注释，如需要可启用）
      e.preventDefault();
    }
  };

  // 处理搜索框失焦
  const handleSearchBlur = () => {
    // 延迟隐藏搜索结果，避免点击事件冲突
    setTimeout(() => {
      setShowSearchResults(false);
    }, 150);
  };

  // 处理搜索结果选择
  const handleSearchResultSelect = (ingredient: Ingredient) => {
    // 检查是否已经选择了这个食材
    const isAlreadySelected = formData.ingredients.some(
      selected => selected.id === ingredient.id
    );
    
    if (!isAlreadySelected) {
      onFormChange({
        ...formData,
        ingredients: [...formData.ingredients, ingredient]
      });
    }
    
    // 清空搜索状态
    setSearchValue('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  return (
    <div className="w-full flex flex-col gap-2 sm:gap-3">
      {/* Recipe Maker 标题栏 - 最顶部 */}
      <div className={cn(
        "pb-2 pt-1",
        isMobile 
          ? "flex flex-col gap-4" 
          : "flex justify-between items-center"
      )}>
        {/* 标题栏 */}
        <div className={cn(
          "flex items-center",
          isMobile ? "flex-col gap-3 text-center" : ""
        )}>
          <h2 className={cn(
            "font-bold text-foreground dark:text-primary",
            isMobile ? "text-3xl" : "text-xl"
          )}>
            {t('mainTitle')}
          </h2>
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
                    isMobile ? "h-14 w-14" : "h-12",
                    showSearchInput 
                      ? "bg-primary text-primary-foreground rounded-l-full shadow-lg shadow-primary/25" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full hover:shadow-md"
                  )}
                >
                  <Search className={cn(
                    "flex-shrink-0 transition-colors duration-300",
                    isMobile ? "h-6 w-6" : "h-5 w-5"
                  )} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tIngredientSelector('searchIconTooltip')}</p>
              </TooltipContent>
            </Tooltip>

                {/* 抽屉式搜索框 - 从按钮右侧边缘展开 */}
                <div 
                  className={cn(
                    "bg-white dark:bg-gray-800 border border-l-0 rounded-r-full overflow-hidden transition-all duration-300 ease-out relative shadow-lg",
                    isMobile ? "h-14" : "h-12",
                    showSearchInput 
                      ? (isMobile ? "w-full opacity-100" : "w-[260px] opacity-100")
                      : "w-0 opacity-0"
                  )}
                >
                  <div className="relative h-full flex items-center">
                    <Input
                      type="text"
                      placeholder={formData.ingredients.length > 0 ? tIngredientSelector('addMoreIngredients') : tIngredientSelector('selectOrEnterIngredients')}
                      className={cn(
                        "h-full pl-4 pr-4 border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                        isMobile ? "text-base" : "text-sm"
                      )}
                      value={searchValue}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      onBlur={handleSearchBlur}
                    />
                  </div>
                </div>
                
                {/* 搜索结果下拉框 - 放在搜索框下方 */}
                {showSearchInput && showSearchResults && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-2">
                    <div 
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl shadow-gray-200/40 dark:shadow-gray-900/40 overflow-hidden w-full"
                      style={{
                        minHeight: '200px',
                      }}
                    >
                      {/* 渐变顶部装饰 */}
                      <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60"></div>
                      
                      {/* 搜索结果标题 */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {tIngredientSelector('searchResults')}
                        </h3>
                      </div>
                      
                      {searchResults.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto">
                          {searchResults.map((ingredient, index) => (
                            <button
                              key={ingredient.id}
                              onClick={() => handleSearchResultSelect(ingredient)}
                              className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 dark:hover:from-primary/10 dark:hover:to-primary/5 transition-all duration-200 border-b border-gray-100/50 dark:border-gray-700/50 last:border-b-0 group"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-200">
                                    <div className="w-2 h-2 bg-primary rounded-full group-hover:scale-110 transition-transform duration-200"></div>
                                  </div>
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
                              {index === 0 && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500">
                                  <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                                    <span className="text-[10px] font-bold">↵</span>
                                  </div>
                                  <span>{tIngredientSelector('pressEnterToQuickSelect')}</span>
                                </div>
                              )}
                            </button>
                          ))}
                          
                          
                        </div>
                      ) : searchValue.trim() ? (
                        <div>
                          {/* 空状态标题 */}
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {tIngredientSelector('noMatchingIngredientsFound')}
                            </h3>
                          </div>
                          <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                              <span className="text-2xl">🔍</span>
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {tIngredientSelector('noMatchingIngredients')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {tIngredientSelector('pressEnterToAddCustom')}
                            </p>
                          </div>
                          
                          {/* 底部提示 */}
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-4 py-3">
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
      <div className={cn("gap-4", isMobile ? "flex flex-col gap-6" : "flex")}>
          {/* 左侧：食材分类tab和食材选择器 */}
          <div className={cn("flex flex-col", isMobile ? "w-full" : "flex-1")}>
            <div className="relative flex-1 min-h-0">
              {/* 左侧背景主体 */}
              <div className={cn(
                "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-2xl flex flex-col shadow-md border border-blue-100 dark:border-blue-800/30",
                isMobile ? "p-4 h-[450px]" : "p-6 h-[400px]"
              )}>

                
                {/* 食材分类tab - 固定高度 */}
            <div className="flex-shrink-0 mb-3">
              {!isMobile ? (
        <TooltipProvider>
          <div className="w-full">
            <div className="flex items-center justify-between pb-1">
              {/* 分类tab */}
              <div className="flex items-center gap-1 flex-1">
                {Object.entries(CATEGORIES).map(([categoryId, category]) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === categoryId;
                  // 优先使用动态获取的分类名称，如果没有则使用翻译作为备用
                  const categoryName = dynamicCategories[categoryId]?.name || tIngredientSelector(`categories.${categoryId}`);

                  return (
                    <Tooltip key={categoryId}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleCategoryChange(categoryId as keyof typeof CATEGORIES)}
                          className={cn(
                            "flex items-center justify-center transition-all duration-300 relative group h-12 flex-1",
                            isActive
                              ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 scale-105 rounded-2xl px-2 gap-2 border-2 border-orange-400/50"
                              : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105 rounded-xl p-2 gap-2"
                          )}
                        >
                          {/* 选中状态的背景装饰 */}
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-amber-500/20 rounded-2xl" />
                          )}
                          
                          <span className={cn(
                            "h-5 w-5 flex-shrink-0 transition-all duration-300 relative z-10",
                            isActive ? "text-white drop-shadow-sm" : category.color,
                            !isActive && "group-hover:scale-125"
                          )}>
                            {Icon}
                          </span>
                          
                          {isActive && (
                            <span className="text-sm font-semibold whitespace-nowrap relative z-10 drop-shadow-sm">
                              {categoryName}
                            </span>
                          )}
                          

                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
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
        <div className="w-full mb-1 space-y-2">
          {/* 分类选择器 */}
          <Select
            value={activeCategory}
            onValueChange={(value) => handleCategoryChange(value as keyof typeof CATEGORIES)}
          >
            <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:border-orange-500/50 focus:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300">
              <SelectValue>
                <div className="flex items-center gap-3">
                  {CATEGORIES[activeCategory] && (() => {
                    const Icon = CATEGORIES[activeCategory].icon;
                    return <span className={cn("h-5 w-5 flex-shrink-0", CATEGORIES[activeCategory].color)}>{Icon}</span>;
                  })()}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {dynamicCategories[activeCategory]?.name || tIngredientSelector(`categories.${activeCategory}`)}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-700 rounded-xl shadow-lg">
              {Object.entries(CATEGORIES).map(([categoryId, category]) => {
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
                        ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-600 dark:text-orange-400 font-semibold border-l-2 border-orange-500" 
                        : "hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className={cn("h-5 w-5 flex-shrink-0", category.color)}>{Icon}</span>
                      <span className="font-medium">
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
          <IngredientSelector
            selectedIngredients={formData.ingredients}
            onIngredientSelect={(ingredient) => {
              onFormChange({ ...formData, ingredients: [...formData.ingredients, ingredient] });
            }}
            onIngredientRemove={(ingredient) => {
              onFormChange({
                ...formData,
                ingredients: formData.ingredients.filter(item => item.id !== ingredient.id)
              });
            }}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            allIngredients={allIngredients}
            dynamicCategories={dynamicCategories}
          />
            </div>
            
            {/* 左侧底部装饰 */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-500 to-transparent rounded-full"></div>
          </div>
          
          {/* 左侧阴影效果 */}
          <div className="absolute -bottom-2 left-2 right-2 h-2 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent rounded-full blur-sm"></div>
        </div>
      </div>
      


          {/* 右侧：已选食材 - 餐饮小票样式 */}
          <div className={cn(isMobile ? "w-full" : "w-80 flex flex-col")}>
            <div className="relative">
              {/* 小票主体 */}
              <div className={cn(
                "bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 flex flex-col border-2 border-gray-200 dark:border-gray-700",
                isMobile ? "p-4 h-[400px]" : "p-6 h-[400px]"
              )}>
                {/* 小票顶部装饰 - 模拟小票撕口 */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-2 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-500 to-transparent rounded-full"></div>
                
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
                          isMobile ? "text-sm" : "text-lg"
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
                              onClick={() => onFormChange({ ...formData, ingredients: [] })}
                              className={cn(
                                "flex items-center justify-center transition-all duration-300 hover:scale-105",
                                isMobile ? "w-8 h-8" : "w-9 h-9"
                              )}
                            >
                              <RotateCcw className={cn(
                                "text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400",
                                isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
                              )} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('reset')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  
                  {/* 小票副标题 */}
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {formData.ingredients.length === 0 
                        ? t('basketSubtitle.empty')
                        : formData.ingredients.length === 1
                        ? t('basketSubtitle.oneMore')
                        : t('basketSubtitle.ready')
                      }
                    </p>
                  </div>
                </div>

                {/* 食材列表 - 小票格式 */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  {formData.ingredients.length === 0 ? (
                    <div className="text-center py-8">
                      <div className={cn(
                        "mx-auto flex items-center justify-center mb-3",
                        isMobile ? "w-12 h-12" : "w-16 h-16"
                      )}>
                        <span className={cn(
                          isMobile ? "text-xl" : "text-2xl"
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
                      <div className="px-3 py-2 border-b border-dashed border-gray-300 dark:border-gray-600 mb-2">
                        <div className="flex text-xs text-gray-500 dark:text-gray-400 font-mono">
                          <span className="w-8 text-center">{t('itemNumber')}</span>
                          <span className="ml-8">{t('itemName')}</span>
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
                              isMobile ? "px-2" : "px-3"
                            )}>
                              {/* 序号列 */}
                              <span className="text-gray-400 dark:text-gray-500 text-xs font-mono font-bold w-8 text-center">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              
                              {/* 食材信息列 */}
                              <div className="flex items-center gap-3 flex-1 min-w-0 ml-8">
                                {/* 食材图标 */}
                                {iconPath && (
                                  <div className="flex-shrink-0">
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
                                        isMobile ? "text-xs" : "text-sm"
                                      )}>
                                        {ingredient.name.toUpperCase()}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-mono">{ingredient.name.toUpperCase()}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              
                              {/* 删除按钮 */}
                              <button
                                onClick={() => {
                                  onFormChange({
                                    ...formData,
                                    ingredients: formData.ingredients.filter(item => item.id !== ingredient.id)
                                  });
                                }}
                                className={cn(
                                  "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 ml-auto",
                                  isMobile ? "p-1" : "p-1.5"
                                )}
                              >
                                <X className={cn(
                                  isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
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
          "flex items-center pt-2 pb-4 border-t border-muted/20",
          isMobile ? "justify-center" : "justify-between"
        )}>
          {/* 内容容器 */}
          <div className={cn(
            "w-full rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800",
            "shadow-sm hover:shadow-md transition-all duration-300",
            isMobile ? "p-6" : "p-4"
          )}>
            <div className={cn(
              "flex items-start justify-between",
              isMobile ? "flex-col gap-6" : "gap-4"
            )}>
              {/* 左侧：高级设置选项 */}
              <div className={cn(
                "flex items-center",
                isMobile ? "flex-col gap-4 w-full" : "flex-wrap gap-4"
              )}>
                {/* 选项图标按钮 - 默认显示 */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowOptions(!showOptions)}
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
                    <TooltipContent>
                      <p>{showOptions ? t('hideOptions') || '隐藏选项' : t('showOptions') || '显示选项'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* 抽屉式选项面板 - 向右弹出（桌面端）/向下展开（移动端） */}
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-500 ease-out",
                    isMobile 
                      ? "flex flex-col gap-3 w-full" 
                      : "flex flex-wrap items-center gap-4",
                    showOptions 
                      ? "h-auto opacity-100" 
                      : "h-0 opacity-0"
                  )}
                  style={{
                    transform: isMobile 
                      ? (showOptions ? 'scaleY(1)' : 'scaleY(0)')
                      : (showOptions ? 'scaleX(1)' : 'scaleX(0)'),
                    transformOrigin: isMobile ? 'top center' : 'left center'
                  }}
                >
                  {/* Servings 步进器 */}
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full sm:w-auto sm:min-w-[170px]">
                    <Label htmlFor="servings" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      <span className="text-base">👥</span>
                      <span>{t('servings')}</span>
                    </Label>
                    <div className="flex items-center gap-1 rounded-md p-1 ml-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                        onClick={() => {
                          if (formData.servings > 1) {
                            onFormChange({ ...formData, servings: formData.servings - 1 })
                          }
                        }}
                        disabled={formData.servings <= 1}
                      >
                        <Minus className="h-2 w-2" />
                      </Button>
                      <div className="w-5 text-center px-1">
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formData.servings}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                        onClick={() => {
                          if (formData.servings < 8) {
                            onFormChange({ ...formData, servings: formData.servings + 1 })
                          }
                        }}
                        disabled={formData.servings >= 8}
                      >
                        <Plus className="h-2 w-2" />
                      </Button>
                    </div>
                  </div>

              {/* Cooking Time 选择器 */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full sm:w-auto sm:min-w-[170px]">
                <Label htmlFor="cookingTime" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  <span className="text-base">⏱️</span>
                  <span>{t('cookingTime')}</span>
                </Label>
                <Select
                  value={formData.cookingTime}
                  onValueChange={(value) => onFormChange({ ...formData, cookingTime: value as 'quick' | 'medium' | 'long' })}
                >
                  <SelectTrigger id="cookingTime" className="h-7 w-16 sm:w-20 text-xs bg-gray-50 dark:bg-gray-700 border-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ml-auto">
                    <SelectValue placeholder={t('selectCookingTime')} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()}>
                    <SelectItem value="quick">{t('quick')}</SelectItem>
                    <SelectItem value="medium">{t('mediumTime')}</SelectItem>
                    <SelectItem value="long">{t('long')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty 选择器 */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full sm:w-auto sm:min-w-[170px]">
                <Label htmlFor="difficulty" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  <span className="text-base">🎚️</span>
                  <span>{t('difficulty')}</span>
                </Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: 'easy' | 'medium' | 'hard') => onFormChange({ ...formData, difficulty: value })}
                >
                  <SelectTrigger id="difficulty" className="h-7 w-16 sm:w-20 text-xs bg-gray-50 dark:bg-gray-700 border-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ml-auto">
                    <SelectValue placeholder={t('selectDifficulty')} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()}>
                    <SelectItem value="easy">{t('easy')}</SelectItem>
                    <SelectItem value="medium">{t('mediumDifficulty')}</SelectItem>
                    <SelectItem value="hard">{t('hard')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cuisine 选择器 */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 h-10 w-full sm:w-auto sm:min-w-[170px]">
                <Label htmlFor="cuisine" className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  <span className="text-base">🌎</span>
                  <span>{t('cuisine')}</span>
                </Label>
                <Select
                  value={formData.cuisine}
                  onValueChange={(value) => onFormChange({ ...formData, cuisine: value })}
                >
                  <SelectTrigger id="cuisine" className="h-7 w-16 sm:w-20 text-xs bg-gray-50 dark:bg-gray-700 border-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ml-auto">
                    <SelectValue placeholder={t('selectCuisine')} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()}>
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
              
              {/* 桌面端：在选项面板末尾添加间距 */}
              {!isMobile && showOptions && (
                <div className="w-16 flex-shrink-0"></div>
              )}
            </div>
          </div>

          {/* 右侧：生成按钮 */}
          <div className={cn(
            "flex items-center flex-shrink-0",
            isMobile ? "w-full justify-center mt-6" : "ml-auto"
          )}>
            <Button
              onClick={handleGenerateClick}
              className={cn(
                "font-medium transition-all duration-300 hover:scale-105",
                isMobile
                  ? "w-full h-14 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                  : "px-3 sm:px-6"
              )}
              size="sm"
              disabled={loading || formData.ingredients.length < 2}
            >
              <Sparkles className={cn(
                "transition-all duration-300",
                isMobile ? "h-5 w-5 mr-2" : "h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4"
              )} />
              {loading ? (
                <>
                  <span className="hidden sm:inline">{t('generating')}</span>
                  <span className="sm:hidden">{t('wait')}</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">{t('generate')}</span>
                  <span className="sm:hidden">{t('go')}</span>
                </>
              )}
            </Button>
          </div>
            </div>
          </div>
        </div>
      
      {/* 登录模态框 */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}; 