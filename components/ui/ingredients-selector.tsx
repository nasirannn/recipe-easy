import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./scroll-area";
import {
  Beef,
  Carrot,
  Apple,
  Milk,
  Nut,
  Flower,
  Sandwich,
  Cookie,
  Fish,
  X,
  Trash2
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Badge } from "./badge";
import { Input } from "./input";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "./dialog";
import { useLocale, useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Ingredient } from "@/lib/types";
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
  'oils-condiments': { icon: Cookie, color: 'text-indigo-600' }
} as const;

interface IngredientSelectorProps {
  selectedIngredients: Ingredient[];
  onIngredientSelect: (ingredient: Ingredient) => void;
  onIngredientRemove?: (ingredient: Ingredient) => void;
  onClearAll?: () => void;
}

interface CustomIngredient extends Ingredient {
  isCustom: boolean;
}

export const IngredientSelector = ({
  selectedIngredients,
  onIngredientSelect,
  onIngredientRemove,
  onClearAll,
}: IngredientSelectorProps) => {
  const locale = useLocale();
  const t = useTranslations('ingredientSelector');
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = React.useState<keyof typeof CATEGORIES>('meat');
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [categorizedIngredients, setCategorizedIngredients] = useState<Record<string, Ingredient[]>>({});
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, { name: string; icon?: any; color?: string }>>({});
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 获取分类数据
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      // 获取分类列表
      const response = await fetch(`/api/categories?lang=${locale}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success && data.data) {
        // 使用API返回的数据
        const categoriesMap: Record<string, { name: string; icon?: any; color?: string }> = {};
        data.data.forEach((category: any) => {
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
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error("获取分类失败", error);
      // 显示错误状态，不提供回退数据
    } finally {
      setLoading(false);
    }
  }, [locale]);

  // 获取所有食材
  const fetchAllIngredients = useCallback(async () => {
    setLoading(true);
    try {
      // 获取所有食材 - 增加limit确保获取所有食材
      const response = await fetch(`/api/ingredients?lang=${locale}&limit=200`);
      const data = await response.json();

      if (!data.success || !data.results) {
        throw new Error('Invalid API response');
      }

      const ingredientsData = data.results;
      // 准备所有食材列表
      setAllIngredients(ingredientsData);

      // 按分类分组食材
      const groupedByCategory: Record<string, Ingredient[]> = {
        all: ingredientsData,
        meat: [],
        seafood: [],
        vegetables: [],
        fruits: [],
        'dairy-eggs': [],
        'grains-bread': [],
        'nuts-seeds': [],
        'herbs-spices': [],
        'oils-condiments': [],
        other: [],
      };

      // 将食材按分类分组
      ingredientsData.forEach((ingredient: Ingredient) => {
        const category = ingredient.category?.slug;
        if (category && groupedByCategory[category]) {
          groupedByCategory[category].push(ingredient);
        } else {
          // 如果没有分类或分类未知，放入其他分类
          groupedByCategory.other.push(ingredient);
        }
      });

      setCategorizedIngredients(groupedByCategory);

      // 设置初始过滤的食材
      // setFilteredIngredients(
      //   groupedByCategory[activeCategory].filter(
      //     ingredient => !selectedIngredients.some(selected => selected.id === ingredient.id)
      //   )
      // );
    } catch (error) {
      console.error("获取食材失败", error);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      // 使用更合适的移动端断点，包括平板设备
      setIsMobile(window.innerWidth < 768);
    };

    // 初始检查
    checkMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 检测滚动位置，决定是否显示浮动按钮 - 使用节流优化性能
  useEffect(() => {
    if (isMobile === null || !isMobile) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          setShowFloatingButton(scrollTop > 200);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // 初始化数据
  useEffect(() => {
    fetchAllIngredients();
    fetchCategories();
  }, [locale, fetchAllIngredients, fetchCategories]);

  // 使用 useMemo 派生过滤后的食材列表，从根源上解决闪动问题
  const filteredIngredients = useMemo(() => {
    if (searchValue.trim()) {
      // 搜索模式：在所有食材中搜索
      return allIngredients.filter(
        ingredient =>
          !selectedIngredients.some(selected => selected.id === ingredient.id) &&
          (ingredient.englishName.toLowerCase().includes(searchValue.toLowerCase()) ||
           ingredient.name.toLowerCase().includes(searchValue.toLowerCase()))
      );
    } else {
      // 分类模式：显示当前分类的食材
      const categoryIngredients = categorizedIngredients[activeCategory] || [];
      return categoryIngredients.filter(
        ingredient => !selectedIngredients.some(selected => selected.id === ingredient.id)
      );
    }
  }, [searchValue, activeCategory, allIngredients, categorizedIngredients, selectedIngredients]);

  // 处理标签的删除
  const handleRemoveIngredient = (ingredient: Ingredient) => {
    if (onIngredientRemove) {
      onIngredientRemove(ingredient);
    }
  };

  // 处理食材选择
  const handleIngredientSelect = (ingredient: Ingredient) => {
    onIngredientSelect(ingredient);
    setSearchValue(""); // 清空搜索
    inputRef.current?.focus(); // 聚焦到输入框
  };

  // 处理自定义输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  // 处理分类切换
  const handleCategoryChange = (categoryId: keyof typeof CATEGORIES) => {
    setActiveCategory(categoryId);
    setSearchValue(""); // 清空搜索
    if (isMobile) {
      setShowCategories(false); // 在移动设备上选择分类后自动隐藏分类列表
    }
  };

  // 处理清空所有食材
  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    }
    setIsDialogOpen(false);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 当输入框有内容且按下Enter键时，将输入内容作为搜索条件
    if (e.key === 'Enter' && searchValue.trim()) {
      e.preventDefault(); // 防止表单提交

      // 先检查是否有匹配的预设食材
      const matchedIngredient = allIngredients.find(
        ingredient =>
          !selectedIngredients.some(selected => selected.id === ingredient.id) &&
          (ingredient.englishName.toLowerCase() === searchValue.toLowerCase() ||
           ingredient.name.toLowerCase() === searchValue.toLowerCase())
      );

      if (matchedIngredient) {
        // 如果有精确匹配的预设食材，直接选择它
        handleIngredientSelect(matchedIngredient);
      } else {
        // 如果没有精确匹配，创建一个带有搜索文本的自定义食材
        const customIngredient: CustomIngredient = {
          id: -Math.floor(Math.random() * 10000), // 使用负数避免与真实食材ID冲突
          slug: `custom-${generateNanoId(8)}`,
          name: searchValue,
          englishName: searchValue,
          category: {
            id: 0,
            slug: 'custom',
            name: 'Custom'
          },
          isCustom: true
        };

        onIngredientSelect(customIngredient);
        setSearchValue(''); // 清空搜索框
      }
    }
  };

  return (
    <div className="w-full space-y-4 relative">
      {/* 输入框和已选食材标签区 */}
      <div className="relative w-full">
        <div className="flex flex-wrap items-center border rounded-lg p-3 gap-2 bg-background">

          {/* 已选的食材标签 */}
          {selectedIngredients.map((ingredient) => (
            <Badge
              key={ingredient.id}
              variant="secondary"
              className={cn(
                "gap-1 py-1 text-sm",
                // @ts-ignore - 检查是否为自定义食材
                ingredient.isCustom && "bg-white text-yellow-600 border-2 border-dashed border-yellow-400 hover:bg-white/90"
              )}
            >
              {ingredient.englishName}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleRemoveIngredient(ingredient)}
              />
            </Badge>
          ))}

          {/* 输入框 */}
          <div className="flex-1 flex items-center min-w-[150px]">
            <Input
              ref={inputRef}
              type="text"
              placeholder={selectedIngredients.length > 0 ? t('addMoreIngredients') : t('selectOrEnterIngredients')}
              className="border-0 shadow-none outline-none ring-0 p-0 h-7 text-sm focus:outline-none focus:ring-0 focus:shadow-none focus:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
              value={searchValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              style={{ boxShadow: 'none' }}
            />

            {/* 清空按钮 - 仅在有选中食材时显示 */}
            {selectedIngredients.length > 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t('clearAll')}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('clearAllIngredients')}</DialogTitle>
                    <DialogDescription>
                      {t('clearAllConfirmation')}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{t('cancel')}</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleClearAll}>
                      {t('confirm')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* 分类选择器 - 桌面版 */}
      {!isMobile && (
        <TooltipProvider>
          <div className="w-full">
            <div className="flex gap-2 pb-2">
              {Object.entries(CATEGORIES).map(([categoryId, category]) => {
                const Icon = category.icon;
                const isActive = activeCategory === categoryId;
                // 优先使用动态获取的分类名称，如果没有则使用翻译作为备用
                const categoryName = dynamicCategories[categoryId]?.name || t(`categories.${categoryId}`);

                return (
                  <Tooltip key={categoryId}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleCategoryChange(categoryId as keyof typeof CATEGORIES)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden relative",
                          "min-w-[85px] max-w-[140px]",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105"
                            : "text-muted-foreground hover:text-foreground hover:scale-102"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors duration-300", isActive ? "text-primary-foreground" : category.color)} />
                        <span className="truncate">{categoryName}</span>
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
        </TooltipProvider>
      )}

      {/* 移动端分类选择器 */}
      {isMobile && (
        <div className="w-full mb-4">
          <Select
            value={activeCategory}
            onValueChange={(value) => handleCategoryChange(value as keyof typeof CATEGORIES)}
          >
            <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:border-primary/50 focus:border-primary transition-all duration-300">
              <SelectValue>
                <div className="flex items-center gap-3">
                  {CATEGORIES[activeCategory] && React.createElement(CATEGORIES[activeCategory].icon, {
                    className: cn("h-5 w-5 flex-shrink-0", CATEGORIES[activeCategory].color)
                  })}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {dynamicCategories[activeCategory]?.name || t(`categories.${activeCategory}`)}
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
                        {dynamicCategories[categoryId]?.name || t(`categories.${categoryId}`)}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 食材网格 */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('loadingIngredients')}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('loadingSubtitle')}</div>
            </div>
          </div>
        ) : (
          <ScrollArea className={cn("w-full", isMobile ? "h-80" : "h-64")}>
            <div className={cn("flex flex-wrap gap-3 p-2", isMobile ? "gap-2" : "gap-3")}>
              {filteredIngredients.map((ingredient) => {
                // 根据食材名称长度动态计算宽度
                const nameLength = ingredient.englishName.length;
                const chineseNameLength = locale === 'zh' && ingredient.name !== ingredient.englishName ? ingredient.name.length : 0;
                const totalLength = Math.max(nameLength, chineseNameLength);
                
                // 动态宽度计算 - 移动端优化
                let cardWidth = isMobile ? 'min-w-[90px] max-w-[160px]' : 'min-w-[100px] max-w-[180px]';
                if (isMobile) {
                  if (totalLength <= 6) {
                    cardWidth = 'min-w-[90px] max-w-[120px]';
                  } else if (totalLength <= 10) {
                    cardWidth = 'min-w-[100px] max-w-[140px]';
                  } else {
                    cardWidth = 'min-w-[110px] max-w-[160px]';
                  }
                } else {
                  if (totalLength <= 8) {
                    cardWidth = 'min-w-[100px] max-w-[140px]';
                  } else if (totalLength <= 12) {
                    cardWidth = 'min-w-[120px] max-w-[160px]';
                  } else {
                    cardWidth = 'min-w-[140px] max-w-[200px]';
                  }
                }
                
                return (
                  <button
                    key={ingredient.id}
                    onClick={() => handleIngredientSelect(ingredient)}
                    className={cn(
                      "group relative rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 hover:from-primary/10 hover:via-primary/5 hover:to-primary/10 text-sm text-center transition-all duration-500 border border-gray-100 dark:border-gray-600 overflow-hidden flex-shrink-0",
                      isMobile 
                        ? "p-3 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95" 
                        : "p-4 hover:scale-110 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-1",
                      cardWidth
                    )}
                  >
                  {/* 背景装饰效果 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* 内容区域 */}
                  <div className="relative z-10 w-full">
                    <div className={cn(
                      "font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-all duration-300 leading-tight break-words",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      {ingredient.englishName}
                    </div>
                    {locale === 'zh' && ingredient.name !== ingredient.englishName && (
                      <div className={cn(
                        "text-gray-600 dark:text-gray-300 mt-1.5 group-hover:text-primary/80 transition-all duration-300 font-medium break-words",
                        isMobile ? "text-[10px] mt-1" : "text-xs mt-1.5"
                      )}>
                        {ingredient.name}
                      </div>
                    )}
                  </div>
                  

                </button>
              );
            })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        )}

        {/* 搜索结果为空时的提示 */}
        {!loading && filteredIngredients.length === 0 && searchValue.trim() && (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {t('noIngredientsFound')} &quot;{searchValue}&quot;
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-xs font-mono border border-gray-300 dark:border-gray-600">Enter</kbd> {t('pressEnterToAdd')}
              </div>
            </div>
          </div>
        )}

        {/* 分类为空时的提示 */}
        {!loading && filteredIngredients.length === 0 && !searchValue.trim() && (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {t('noIngredientsInCategory')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('tryOtherCategoryOrSearch')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 移动端浮动按钮 */}
      {isMobile && showFloatingButton && selectedIngredients.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
            onClick={() => {
              // 滚动到顶部，使用更平滑的方式
              window.scrollTo({ 
                top: 0, 
                behavior: 'smooth' 
              });
            }}
          >
            <div className="flex flex-col items-center">
              <div className="text-xs font-bold">{selectedIngredients.length}</div>
              <div className="text-xs">{t('items')}</div>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
};
