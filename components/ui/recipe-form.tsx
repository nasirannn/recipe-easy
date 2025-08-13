"use client"

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { IngredientSelector } from "./ingredients-selector";
import { Sliders, Clock, Users, Gauge, Globe, Sparkles, Image as ImageIcon, X, Beef, Carrot, Apple, Milk, Nut, Flower, Sandwich, Cookie, Fish, RotateCcw, Search, List } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { cn } from "@/lib/utils";
import { getRecommendedModels } from "@/lib/config";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCuisines } from "@/hooks/use-cuisines";
import { useTranslations, useLocale } from 'next-intl';
import { RecipeFormData, Ingredient } from "@/lib/types";
import { ImageModel } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Input } from "@/components/ui/input";
import { generateNanoId } from '@/lib/utils/id-generator';

// 分类图标映射 - 与数据库slug对应
const CATEGORIES = {
  meat: { icon: Beef, color: 'text-red-600' },
  seafood: { icon: Fish, color: 'text-blue-600' },
  vegetables: { icon: Carrot, color: 'text-green-600' },
  fruits: { icon: Apple, color: 'text-yellow-600' },
  'dairy-eggs': { icon: Milk, color: 'text-purple-600' },
  'grains-bread': { icon: Sandwich, color: 'text-amber-600' },
  'nuts-seeds': { icon: Nut, color: 'text-orange-600' },
  'herbs-spices': { icon: Flower, color: 'text-emerald-600' },
} as const;

interface RecipeFormProps {
  formData: RecipeFormData;
  onFormChange: (data: RecipeFormData) => void;
  onSubmit: () => void;
  loading: boolean;
  showRecipe: boolean;
  setShowRecipe: (show: boolean) => void;
}

export const RecipeForm = ({
  formData,
  onFormChange,
  onSubmit,
  loading,
  setShowRecipe,
}: RecipeFormProps) => {
  const { isAdmin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const { cuisines, loading: cuisinesLoading } = useCuisines();
  const t = useTranslations('recipeForm');
  const tIngredientSelector = useTranslations('ingredientSelector');
  const locale = useLocale();
  
  // 分类相关状态
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES>('meat');
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, { name: string; icon?: any; color?: string }>>({});
  const [searchValue, setSearchValue] = useState('');
  
  // 新增：搜索相关状态
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);

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
          const categoriesMap: Record<string, { name: string; icon?: any; color?: string }> = {};
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

  // 新增：处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (value.trim()) {
      // 根据输入内容搜索食材
      const results = allIngredients.filter(ingredient => 
        ingredient.name.toLowerCase().includes(value.toLowerCase()) &&
        !formData.ingredients.some(selected => selected.id === ingredient.id)
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  // 新增：处理搜索结果的食材选择
  const handleSearchResultSelect = (ingredient: Ingredient) => {
    onFormChange({ ...formData, ingredients: [...formData.ingredients, ingredient] });
    setSearchValue('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // 新增：处理键盘事件
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      e.preventDefault();
      
      // 先检查是否有匹配的预设食材
      const matchedIngredient = allIngredients.find(
        ingredient =>
          ingredient.name.toLowerCase() === searchValue.toLowerCase() &&
          !formData.ingredients.some(selected => selected.id === ingredient.id)
      );

      if (matchedIngredient) {
        // 如果有精确匹配的预设食材，直接选择它
        handleSearchResultSelect(matchedIngredient);
      } else {
        // 如果没有精确匹配，创建一个自定义食材
        const customIngredient = {
          id: generateNanoId(),
          name: searchValue.trim(),
          category: {
            id: 0,
            slug: activeCategory,
            name: dynamicCategories[activeCategory]?.name || tIngredientSelector(`categories.${activeCategory}`)
          },
          isCustom: true
        };
        onFormChange({ ...formData, ingredients: [...formData.ingredients, customIngredient] });
        setSearchValue('');
        setShowSearchResults(false);
      }
    } else if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSearchValue('');
    }
  };

  // 新增：处理输入框失去焦点
  const handleSearchBlur = () => {
    // 延迟隐藏搜索结果，避免点击结果时无法选择
    setTimeout(() => {
      setShowSearchResults(false);
    }, 200);
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

  // 处理图片模型变更
  const handleModelChange = (model: ImageModel) => {
    onFormChange({
      ...formData,
      imageModel: model
    });
  };

  return (
    <div className="w-full flex flex-col gap-2 sm:gap-3">
      {/* 分类选择器 - 桌面版 */}
      {!isMobile && (
        <TooltipProvider>
          <div className="w-full">

            <div className="flex items-center justify-between gap-3 pb-2 pt-2">
              {/* 分类tab */}
              <div className="flex gap-2">
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
                            "flex items-center justify-center transition-all duration-300 relative group h-12",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105 rounded-3xl px-4 gap-2 min-w-[120px] max-w-[200px]"
                              : "text-muted-foreground hover:text-foreground hover:scale-102 rounded-full p-3 min-w-[60px] max-w-[60px]"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 flex-shrink-0 transition-colors duration-300", isActive ? "text-primary-foreground" : category.color)} />
                          {isActive && (
                            <span className="truncate text-sm font-medium whitespace-nowrap">{categoryName}</span>
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

              {/* 食材输入框 - 固定在右侧，宽度较小 */}
              <div className="w-80 flex-shrink-0 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={formData.ingredients.length > 0 ? tIngredientSelector('addMoreIngredients') : tIngredientSelector('selectOrEnterIngredients')}
                    className="h-12 pl-10 pr-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={searchValue}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    onBlur={handleSearchBlur}
                  />
                </div>
                
                {/* 搜索结果下拉框 */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((ingredient) => (
                      <button
                        key={ingredient.id}
                        onClick={() => handleSearchResultSelect(ingredient)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {ingredient.name}
                          </span>
                          {ingredient.category && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {ingredient.category.name}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* 无搜索结果提示 */}
                {showSearchResults && searchValue.trim() && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 p-4">
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      <p>{tIngredientSelector('noMatchingIngredients')}</p>
                      <p className="mt-1">{tIngredientSelector('pressEnterToAddCustom')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TooltipProvider>
      )}

      {/* 移动端分类选择器 */}
      {isMobile && (
        <div className="w-full mb-2 space-y-3">

          {/* 分类选择器 */}
          <Select
            value={activeCategory}
            onValueChange={(value) => handleCategoryChange(value as keyof typeof CATEGORIES)}
          >
            <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:border-primary/50 focus:border-primary transition-all duration-300">
              <SelectValue>
                <div className="flex items-center gap-3">
                  {CATEGORIES[activeCategory] && (() => {
                    const Icon = CATEGORIES[activeCategory].icon;
                    return <Icon className={cn("h-5 w-5 flex-shrink-0", CATEGORIES[activeCategory].color)} />;
                  })()}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {dynamicCategories[activeCategory]?.name || tIngredientSelector(`categories.${activeCategory}`)}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg">
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
                        ? "bg-primary/10 text-primary font-medium" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Icon className={cn("h-5 w-5 flex-shrink-0", category.color)} />
                      <span className="font-medium">
                        {dynamicCategories[categoryId]?.name || tIngredientSelector(`categories.${categoryId}`)}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {/* 移动端搜索框 */}
          <div className="w-full relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={formData.ingredients.length > 0 ? tIngredientSelector('addMoreIngredients') : tIngredientSelector('selectOrEnterIngredients')}
                className="h-12 pl-10 pr-4 border-0 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:border-primary/50 focus:border-primary transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onBlur={handleSearchBlur}
              />
            </div>
            
            {/* 移动端搜索结果下拉框 */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchResults.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    onClick={() => handleSearchResultSelect(ingredient)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {ingredient.name}
                      </span>
                      {ingredient.category && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {ingredient.category.name}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* 移动端无搜索结果提示 */}
            {showSearchResults && searchValue.trim() && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 p-4">
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>{tIngredientSelector('noMatchingIngredients')}</p>
                  <p className="mt-1">{tIngredientSelector('pressEnterToAddCustom')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 食材选择与输入集成区域 */}
      <div className="relative w-full mx-auto rounded-lg sm:rounded-xl">
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
        />

        {/* 已选食材展示区 - 独立区域 */}
        <div className="w-full mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {tIngredientSelector('selectedIngredients')}
              </h3>
            </div>
          </div>
          
          {formData.ingredients.length > 0 ? (
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {formData.ingredients.map((ingredient) => (
                <Badge
                  key={ingredient.id}
                  variant="secondary"
                  className={cn(
                    "gap-1 py-1 text-sm",
                    // @ts-ignore - 检查是否为自定义食材
                    ingredient.isCustom && "bg-white text-yellow-600 border-2 border-dashed border-yellow-400 hover:bg-white/90"
                  )}
                >
                  {ingredient.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => {
                      onFormChange({
                        ...formData,
                        ingredients: formData.ingredients.filter(item => item.id !== ingredient.id)
                      });
                    }}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <div className="min-h-[32px] flex items-center">
              <p className="text-sm text-muted-foreground font-medium">
                {tIngredientSelector('ingredientsHint')}
              </p>
            </div>
          )}
        </div>
        {/* 生成按钮和高级设置 */}
        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 border-t border-muted/20">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs flex gap-1.5 h-7 px-2 sm:px-3">
                  <Sliders className="h-3 w-3" />
                  {/* <span className="hidden sm:inline-block">{t('moreOptions')}</span> */}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[240px] sm:w-[260px]"
                onInteractOutside={(e) => {
                  // 阻止交互外部事件关闭弹窗
                  e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                  // 阻止点击外部事件关闭弹窗
                  e.preventDefault();
                }}
                align="start"
                side="bottom"
                sideOffset={4}
                alignOffset={0}
              >
                <div className="flex items-center justify-end mb-2">
                  {/* <h3 className="text-sm font-medium">{t('moreOptions')}</span> */}
                  <PopoverClose className="rounded-full h-5 w-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </PopoverClose>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="servings" className="flex items-center gap-1 sm:gap-2 text-sm">
                        <Users className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
                        <span>{t('servings')}</span>
                      </Label>
                      <span className="text-xs sm:text-sm font-medium">{formData.servings} {t('servingsCount')}</span>
                    </div>
                    <Slider
                      id="servings"
                      min={1}
                      max={8}
                      step={1}
                      value={[formData.servings]}
                      onValueChange={(value: number[]) => {
                        onFormChange({ ...formData, servings: value[0] })
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="cookingTime" className="flex items-center gap-1 sm:gap-2 text-sm">
                      <Clock className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
                      <span>{t('cookingTime')}</span>
                    </Label>
                    <Select
                      value={formData.cookingTime}
                      onValueChange={(value) => onFormChange({ ...formData, cookingTime: value as 'quick' | 'medium' | 'long' })}
                    >
                      <SelectTrigger id="cookingTime" className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder={t('selectCookingTime')} />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()}>
                        <SelectItem value="quick">{t('quick')}</SelectItem>
                        <SelectItem value="medium">{t('medium')}</SelectItem>
                        <SelectItem value="long">{t('long')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="difficulty" className="flex items-center gap-1 sm:gap-2 text-sm">
                      <Gauge className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
                      <span>{t('difficulty')}</span>
                    </Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => onFormChange({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger id="difficulty" className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder={t('selectDifficulty')} />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()}>
                        <SelectItem value="easy">{t('easy')}</SelectItem>
                        <SelectItem value="medium">{t('mediumDifficulty')}</SelectItem>
                        <SelectItem value="hard">{t('hard')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="cuisine" className="flex items-center gap-1 sm:gap-2 text-sm">
                      <Globe className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
                      <span>{t('cuisine')}</span>
                    </Label>
                    <Select
                      value={formData.cuisine}
                      onValueChange={(value) => onFormChange({ ...formData, cuisine: value })}
                    >
                      <SelectTrigger id="cuisine" className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder={t('selectCuisine')} />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} onCloseAutoFocus={(e) => e.preventDefault()}>
                        <SelectItem value="any">{t('anyCuisine')}</SelectItem>
                        {cuisinesLoading ? (
                          <SelectItem value="" disabled>{t('loadingCuisines')}</SelectItem>
                        ) : (
                          cuisines.map((cuisine) => (
                            <SelectItem key={cuisine.id} value={cuisine.name.toLowerCase()}>
                              {cuisine.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* 语言模型选择器 - 仅管理员可见 */}
            {isAdmin && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs flex gap-1.5 h-7 px-2 sm:px-3">
                    <Sparkles className="h-3 w-3" />
                    <span className="hidden sm:inline-block">Language Model</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[240px] sm:w-[260px]"
                  onInteractOutside={(e) => {
                    // 阻止交互外部事件关闭弹窗
                    e.preventDefault();
                  }}
                  onPointerDownOutside={(e) => {
                    // 阻止点击外部事件关闭弹窗
                    e.preventDefault();
                  }}
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  alignOffset={0}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Language Model</h3>
                    <PopoverClose className="rounded-full h-5 w-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </PopoverClose>
                  </div>
                  <div className="space-y-3">
                    <RadioGroup
                      value={formData.languageModel || (locale === 'zh' ? 'QWENPLUS' : 'GPT4o_MINI')}
                      onValueChange={value => onFormChange({ ...formData, languageModel: value as 'QWENPLUS' | 'GPT4o_MINI' })}
                      className="grid grid-cols-1 gap-3"
                    >
                      <div className={`flex flex-col gap-2 border rounded-lg p-3 ${(formData.languageModel || (locale === 'zh' ? 'QWENPLUS' : 'GPT4o_MINI')) === 'QWENPLUS' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'}`}>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="QWENPLUS" id="lm-qwenplus" />
                          <Label htmlFor="lm-qwenplus" className="font-medium cursor-pointer">Qwen Plus</Label>
                        </div>
                        <div className="text-xs text-muted-foreground pl-6">
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Alibaba Qwen</li>
                            <li>OpenAI compatible</li>
                            <li>Good for Chinese</li>
                          </ul>
                        </div>
                      </div>
                      <div className={`flex flex-col gap-2 border rounded-lg p-3 ${(formData.languageModel || (locale === 'zh' ? 'QWENPLUS' : 'GPT4o_MINI')) === 'GPT4o_MINI' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'}`}>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="GPT4o_MINI" id="lm-gpt4o_mini" />
                          <Label htmlFor="lm-gpt4o_mini" className="font-medium cursor-pointer">GPT-4o Mini</Label>
                        </div>
                        <div className="text-xs text-muted-foreground pl-6">
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Latest OpenAI</li>
                            <li>Low latency & cost</li>
                            <li>Best for English</li>
                          </ul>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </PopoverContent>
              </Popover>
            )} 

            {/* 图片生成模型选择器 - 仅管理员可见 */}
            {isAdmin && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs flex gap-1.5 h-7 px-2 sm:px-3">
                    <ImageIcon className="h-3 w-3" />
                    <span className="hidden sm:inline-block">Image Model</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[240px] sm:w-[260px]"
                  onInteractOutside={(e) => {
                    // 阻止交互外部事件关闭弹窗
                    e.preventDefault();
                  }}
                  onPointerDownOutside={(e) => {
                    // 阻止点击外部事件关闭弹窗
                    e.preventDefault();
                  }}
                  align="start"
                  sideOffset={8}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Image Generation Model</h3>
                    <PopoverClose className="rounded-full h-5 w-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </PopoverClose>
                  </div>
                  <div className="space-y-3">
                    <RadioGroup 
                      value={formData.imageModel || (locale === 'zh' ? 'wanx' : 'flux')}
                      onValueChange={value => handleModelChange(value as ImageModel)}
                      className="grid grid-cols-1 gap-3"
                    >
                      <div className={`flex flex-col gap-2 border rounded-lg p-3 ${(formData.imageModel || (locale === 'zh' ? 'wanx' : 'flux')) === 'wanx' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'}`}>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="wanx" id="model-wanx" />
                          <Label htmlFor="model-wanx" className="font-medium cursor-pointer">Wanx Model</Label>
                        </div>
                        <div className="text-xs text-muted-foreground pl-6">
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Free</li>
                            <li>Good for Chinese prompts</li>
                            <li>Faster generation (10-15s)</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className={`flex flex-col gap-2 border rounded-lg p-3 ${(formData.imageModel || (locale === 'zh' ? 'wanx' : 'flux')) === 'flux' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'}`}>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="flux" id="model-flux" />
                          <Label htmlFor="model-flux" className="font-medium cursor-pointer">Flux Schnell</Label>
                        </div>
                        <div className="text-xs text-muted-foreground pl-6">
                          <ul className="list-disc pl-4 space-y-1">
                            <li>High quality</li>
                            <li>Better realism and details</li>
                            <li>Faster generation (8-15s)</li>
                          </ul>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div
            className={cn(
              isMobile ? "flex justify-center w-full" : "",
              "mt-4"
            )}
          >
            <div className={cn(
              "flex items-center gap-2",
              isMobile ? "w-full justify-center" : ""
            )}>
              {/* Reset按钮 */}
              <Button
                variant="outline"
                onClick={() => onFormChange({ ...formData, ingredients: [] })}
                className={cn(
                  "font-medium",
                  isMobile ? "flex-1 max-w-[120px]" : "px-3 sm:px-6"
                )}
                size="sm"
                disabled={formData.ingredients.length === 0}
              >
                <RotateCcw className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('reset')}</span>
                <span className="sm:hidden">{t('reset')}</span>
              </Button>
              
              {/* 生成按钮 */}
              <Button
                onClick={handleGenerateClick}
                className={cn(
                  "font-medium",
                  isMobile
                    ? "flex-1 max-w-[200px]"
                    : "px-3 sm:px-6"
                )}
                size="sm"
                disabled={loading || formData.ingredients.length < 2}
              >
                <Sparkles className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
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