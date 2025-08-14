"use client"

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, } from "react";
import { IngredientSelector } from "./ingredients-selector";
import { Sliders, Clock, Users, Gauge, Globe, Sparkles, Image as ImageIcon, X, RotateCcw, Search, List } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { cn } from "@/lib/utils";
import { useCuisines } from "@/hooks/use-cuisines";
import { useTranslations, useLocale } from 'next-intl';
import { RecipeFormData, Ingredient } from "@/lib/types";
import { ImageModel } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Input } from "@/components/ui/input";
import { generateNanoId } from '@/lib/utils/id-generator';

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
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, { name: string; icon?: string; color?: string }>>({});
  const [searchValue, setSearchValue] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  
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

  // 处理搜索图标点击 - 支持切换显示/隐藏
  const handleSearchIconClick = () => {
    setShowSearchInput(!showSearchInput);
    // 如果关闭搜索框，清空搜索内容
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
              <div className="flex items-center gap-2">
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
                          <span className={cn("h-5 w-5 flex-shrink-0 transition-colors duration-300", isActive ? "text-primary-foreground" : category.color)}>{Icon}</span>
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
                
                {/* 搜索按钮和搜索框容器 - 抽屉式展开 */}
                <div className="relative flex items-center">
                  {/* 搜索按钮 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleSearchIconClick}
                        className={cn(
                          "flex items-center justify-center transition-all duration-300 relative z-10 h-12",
                          showSearchInput
                            ? "bg-secondary text-secondary-foreground shadow-md shadow-secondary/25 rounded-l-full px-3 min-w-[60px] max-w-[60px]"
                            : "text-muted-foreground hover:text-foreground hover:scale-102 rounded-full p-3 min-w-[60px] max-w-[60px] hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <Search className={cn("h-5 w-5 flex-shrink-0 transition-colors duration-300", showSearchInput ? "text-primary-foreground" : "text-gray-600 dark:text-gray-400")} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{showSearchInput ? tIngredientSelector('hideSearch') || '隐藏搜索' : tIngredientSelector('searchIconTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* 抽屉式搜索框 - 从按钮右侧边缘展开 */}
                  <div 
                    className={cn(
                      "h-12 bg-white dark:bg-gray-800 border-2 border-l-0 border-secondary rounded-r-full shadow-lg overflow-hidden transition-all duration-500 ease-out",
                      showSearchInput 
                        ? "w-80 opacity-100" 
                        : "w-0 opacity-0"
                    )}
                    style={{
                      transform: showSearchInput ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'left center'
                    }}
                  >
                    <div className="relative h-full flex items-center">
                      <Input
                        type="text"
                        placeholder={formData.ingredients.length > 0 ? tIngredientSelector('addMoreIngredients') : tIngredientSelector('selectOrEnterIngredients')}
                        className="h-full pl-4 pr-4 border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 text-sm"
                        value={searchValue}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        onBlur={handleSearchBlur}
                        autoFocus
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
            </div>
          </div>
        </TooltipProvider>
      )}

      {/* 移动端分类选择器 */}
      {isMobile && (
        <div className="w-full mb-1 space-y-2">
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
                    return <span className={cn("h-5 w-5 flex-shrink-0", CATEGORIES[activeCategory].color)}>{Icon}</span>;
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
          
          {/* 移动端搜索框 - 默认显示，不需要隐藏交互 */}
          <div className="relative w-full">
            <div className="w-full h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:border-primary/50 focus-within:border-primary transition-all duration-300">
              <div className="relative h-full flex items-center">
                <Search className="absolute left-4 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={formData.ingredients.length > 0 ? tIngredientSelector('addMoreIngredients') : tIngredientSelector('selectOrEnterIngredients')}
                  className="h-full pl-12 pr-4 border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 text-sm"
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
        <div className="w-full mt-4 p-4 rounded-lg">
          <div className="mb-3">
            <div className="flex items-center gap-2">
             <span>🍳</span> 
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {tIngredientSelector('selectedIngredients')}
              </h3>
              {formData.ingredients.length === 1 && (
                <span className="text-xs text-muted-foreground">
                  {tIngredientSelector('oneMoreToGo')}
                </span>
              )}
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
        <div className={cn(
          "flex items-center mt-3 sm:mt-4 pt-3 border-t border-muted/20",
          isMobile ? "justify-center" : "justify-end"
        )}>
          <div
            className={cn(
              "flex items-center gap-2",
              isMobile ? "w-full" : ""
            )}
          >
            <div className={cn(
              "flex items-center gap-2",
              isMobile ? "w-full" : ""
            )}>
              {/* More Options按钮 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "font-medium",
                      isMobile ? "w-1/4" : "px-3 sm:px-6"
                    )}
                  >
                    <Sliders className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('moreOptions')}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[240px] sm:w-[260px]"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  alignOffset={0}
                >

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

              {/* Reset按钮 */}
              <Button
                variant="outline"
                onClick={() => onFormChange({ ...formData, ingredients: [] })}
                className={cn(
                  "font-medium",
                  isMobile ? "w-1/4" : "px-3 sm:px-6"
                )}
                size="sm"
                disabled={formData.ingredients.length === 0}
              >
                <RotateCcw className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('reset')}</span>
              </Button>
              
              {/* 生成按钮 */}
              <Button
                onClick={handleGenerateClick}
                className={cn(
                  "font-medium",
                  isMobile
                    ? "w-1/2"
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