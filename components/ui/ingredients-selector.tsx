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
  ChevronDown,
  Trash2
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
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

// 食材接口定义
interface Ingredient {
  id: string;
  slug?: string;
  name: string;
  englishName: string;
  category?: {
    id: number;
    slug: string;
    name: string;
  };
  isCustom?: boolean; // 仅用于前端临时标识自定义食材
}

// 分类图标映射
const CATEGORIES = {
  meat: { icon: Beef, color: 'text-red-600' },
  seafood: { icon: Fish, color: 'text-blue-600' },
  vegetable: { icon: Carrot, color: 'text-green-600' },
  fruit: { icon: Apple, color: 'text-yellow-600' },
  dairy: { icon: Milk, color: 'text-purple-600' },
  grains: { icon: Sandwich, color: 'text-amber-600' },
  nuts: { icon: Nut, color: 'text-orange-600' },
  herbs: { icon: Flower, color: 'text-emerald-600' },
  condiments: { icon: Cookie, color: 'text-indigo-600' }
} as const;

interface IngredientSelectorProps {
  selectedIngredients: Ingredient[];
  onIngredientSelect: (ingredient: Ingredient) => void;
  onIngredientRemove?: (ingredient: Ingredient) => void;
  onClearAll?: () => void;
}

// 自定义食材类型
interface CustomIngredient extends Ingredient {
  isCustom: boolean;
}

// 自定义食材类型
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
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [categorizedIngredients, setCategorizedIngredients] = useState<Record<string, Ingredient[]>>({});
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, {name: string, icon: any, color: string}>>({});
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 获取分类数据
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getCategories',
          language: locale
        })
      });

      const data = await response.json();

      if (data.success) {
        const categories: Record<string, {name: string, icon: any, color: string}> = {};

        data.data.forEach((category: any) => {
          // 映射数据库分类到UI分类
          const uiCategoryKey = categoryMapping[category.slug] || 'condiments';
          if (CATEGORIES[uiCategoryKey]) {
            categories[uiCategoryKey] = {
              name: category.name,
              icon: CATEGORIES[uiCategoryKey].icon,
              color: CATEGORIES[uiCategoryKey].color
            };
          }
        });

        setDynamicCategories(categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // 如果获取失败，使用静态翻译作为备用
    }
  };

  // 映射数据库分类到UI分类的函数
  const categoryMapping: Record<string, keyof typeof CATEGORIES> = {
    'meat': 'meat',
    'seafood': 'seafood',
    'vegetables': 'vegetable',
    'fruits': 'fruit',
    'dairy-eggs': 'dairy',
    'grains-bread': 'grains',
    'nuts-seeds': 'nuts',
    'herbs-spices': 'herbs',
    'oils-condiments': 'condiments'
  };

  // 获取所有食材数据并按分类组织
  const fetchAllIngredients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ingredients?lang=${locale}&limit=200`);
      const data = await response.json();

      if (data.success) {
        const ingredients = data.data.map((item: any) => ({
          id: item.slug || item.id.toString(),
          slug: item.slug,
          name: item.name,
          englishName: item.name,
          category: item.category,
          isCustom: false // 数据库中的食材都是系统预置的
        }));

        setAllIngredients(ingredients);

        // 按分类组织食材
        const categorized: Record<string, Ingredient[]> = {};

        ingredients.forEach((ingredient: Ingredient) => {
          const dbCategory = ingredient.category?.slug;
          const uiCategory = dbCategory ? categoryMapping[dbCategory] : 'condiments';

          if (uiCategory && !categorized[uiCategory]) {
            categorized[uiCategory] = [];
          }
          if (uiCategory) {
            categorized[uiCategory].push(ingredient);
          }
        });

        setCategorizedIngredients(categorized);
      }
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
      setCategorizedIngredients({});
    } finally {
      setLoading(false);
    }
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

  // 检测滚动位置，决定是否显示浮动按钮
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowFloatingButton(scrollTop > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // 初始化数据
  useEffect(() => {
    fetchAllIngredients();
    fetchCategories();
  }, [locale]);

  // 处理搜索输入
  useEffect(() => {
    if (searchValue.trim()) {
      const filtered = allIngredients.filter(
        ingredient =>
          !selectedIngredients.some(selected => selected.id === ingredient.id) &&
          (ingredient.englishName.toLowerCase().includes(searchValue.toLowerCase()) ||
           ingredient.name.toLowerCase().includes(searchValue.toLowerCase()))
      );
      setFilteredIngredients(filtered);
    } else {
      // 当搜索为空时，显示当前分类的食材
      const categoryIngredients = categorizedIngredients[activeCategory] || [];
      setFilteredIngredients(
        categoryIngredients.filter(
          ingredient => !selectedIngredients.some(selected => selected.id === ingredient.id)
        )
      );
    }
  }, [searchValue, selectedIngredients, activeCategory, allIngredients, categorizedIngredients]);

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
          id: `custom-${Date.now()}`,
          name: searchValue,
          englishName: searchValue,
          category: undefined,
          isCustom: true
        };

        onIngredientSelect(customIngredient);
        setSearchValue(''); // 清空搜索框
      }
    }
  };

  // 移除未使用的变量

  return (
    <div className="w-full space-y-4 relative">
      {/* 输入框和已选食材标签区 */}
      <div className="relative w-full">
        <div className="flex flex-wrap items-center border rounded-lg p-3 gap-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary bg-background">

          {/* 已选的食材标签 */}
          {selectedIngredients.map((ingredient) => (
            <Badge
              key={ingredient.id}
              variant="secondary"
              className={cn(
                "gap-1 py-1 text-sm",
                // @ts-ignore - 检查是否为自定义食材
                ingredient.isCustom && "border border-dashed border-primary/50"
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
              className="border-none shadow-none focus-visible:ring-0 p-0 h-7 text-sm"
              value={searchValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
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
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap overflow-hidden",
                          "min-w-[85px] max-w-[140px]",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary-foreground" : category.color)} />
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
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center gap-2"
          >
            {CATEGORIES[activeCategory] && (
              <>
                {React.createElement(CATEGORIES[activeCategory].icon, {
                  className: cn("h-4 w-4", CATEGORIES[activeCategory].color)
                })}
                {dynamicCategories[activeCategory]?.name || t(`categories.${activeCategory}`)}
              </>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform", showCategories && "rotate-180")} />
          </Button>
        </div>
      )}

      {/* 移动端分类下拉菜单 */}
      {isMobile && showCategories && (
        <div className="bg-background border rounded-lg shadow-lg p-2 space-y-1">
          {Object.entries(CATEGORIES).map(([categoryId, category]) => {
            const Icon = category.icon;
            const isActive = activeCategory === categoryId;

            return (
              <button
                key={categoryId}
                onClick={() => handleCategoryChange(categoryId as keyof typeof CATEGORIES)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : category.color)} />
                {dynamicCategories[categoryId]?.name || t(`categories.${categoryId}`)}
              </button>
            );
          })}
        </div>
      )}

      {/* 食材网格 */}
      <div className="w-full">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">{t('loadingIngredients')}</span>
          </div>
        ) : (
          <ScrollArea className="h-64 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-1">
              {filteredIngredients.map((ingredient) => (
                <button
                  key={ingredient.id}
                  onClick={() => handleIngredientSelect(ingredient)}
                  className="group relative p-3 rounded-lg bg-card hover:bg-accent border border-border text-sm text-center transition-all duration-200 hover:shadow-sm"
                >
                  <div className="font-medium text-foreground group-hover:text-accent-foreground">
                    {ingredient.englishName}
                  </div>
                  {locale === 'zh' && ingredient.name !== ingredient.englishName && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {ingredient.name}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        )}

        {/* 搜索结果为空时的提示 */}
        {!loading && filteredIngredients.length === 0 && searchValue.trim() && (
          <div className="text-center py-8 space-y-2">
            <div className="text-muted-foreground">
              {t('noIngredientsFound')} "{searchValue}"
            </div>
            <div className="text-sm text-muted-foreground">
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> {t('pressEnterToAdd')}
            </div>
          </div>
        )}

        {/* 分类为空时的提示 */}
        {!loading && filteredIngredients.length === 0 && !searchValue.trim() && (
          <div className="text-center py-8 text-muted-foreground">
{t('noIngredientsInCategory')}
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
              // 滚动到顶部
              window.scrollTo({ top: 0, behavior: 'smooth' });
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
