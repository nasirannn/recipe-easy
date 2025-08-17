import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./scroll-area";
import {
  X
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Badge } from "./badge";
import { Input } from "./input";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import Image from "next/image";

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
  meat: { icon: '🥩', color: 'text-red-600' },
  seafood: { icon: '🐟', color: 'text-blue-600' },
  vegetables: { icon: '🥬', color: 'text-green-600' },
  fruits: { icon: '🍎', color: 'text-yellow-600' },
  'dairy-eggs': { icon: '🥚', color: 'text-purple-600' },
  'grains-bread': { icon: '🌾', color: 'text-amber-600' },
  'nuts-seeds': { icon: '🌰', color: 'text-orange-600' },
  'herbs-spices': { icon: '🌿', color: 'text-emerald-600' }
} as const;

interface IngredientSelectorProps {
  selectedIngredients: Ingredient[];
  onIngredientSelect: (ingredient: Ingredient) => void;
  onIngredientRemove?: (ingredient: Ingredient) => void;
  activeCategory?: keyof typeof CATEGORIES;
  onCategoryChange?: (categoryId: keyof typeof CATEGORIES) => void;
  // 新增：接收食材数据作为 props
  allIngredients: Ingredient[];
  dynamicCategories: Record<string, { name: string; icon?: string; color?: string }>;
}

interface CustomIngredient extends Ingredient {
  isCustom: boolean;
}

export const IngredientSelector = ({
  selectedIngredients,
  onIngredientSelect,
  onIngredientRemove,
  activeCategory: externalActiveCategory,
  onCategoryChange,
  allIngredients,
  dynamicCategories,
}: IngredientSelectorProps) => {
  const locale = useLocale();
  const t = useTranslations('ingredientSelector');
  const [searchValue, setSearchValue] = useState("");
  const [internalActiveCategory, setInternalActiveCategory] = React.useState<keyof typeof CATEGORIES>('meat');
  
  // 使用外部传入的分类或内部状态
  const activeCategory = externalActiveCategory || internalActiveCategory;
  const [categorizedIngredients, setCategorizedIngredients] = useState<Record<string, Ingredient[]>>({});
  const [loading, setLoading] = useState(false); // 改为 false，因为不再需要加载
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // 移除食材获取逻辑，直接使用 props 中的数据
  // 当 allIngredients 或 dynamicCategories 变化时，重新计算分类食材
  useEffect(() => {
    if (allIngredients.length > 0) {
      // 按分类分组食材
      const groupedByCategory: Record<string, Ingredient[]> = {
        all: allIngredients,
        meat: [],
        seafood: [],
        vegetables: [],
        fruits: [],
        'dairy-eggs': [],
        'grains-bread': [],
        'nuts-seeds': [],
        'herbs-spices': [],
        other: [],
      };

      // 将食材按分类分组
      allIngredients.forEach((ingredient: Ingredient) => {
        const category = ingredient.category?.slug;
        if (category && groupedByCategory[category]) {
          groupedByCategory[category].push(ingredient);
        } else {
          // 如果没有分类或分类未知，放入其他分类
          groupedByCategory.other.push(ingredient);
        }
      });

      setCategorizedIngredients(groupedByCategory);
    }
  }, [allIngredients]);

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

  // 使用 useMemo 派生过滤后的食材列表，从根源上解决闪动问题
  const filteredIngredients = useMemo(() => {
    // 确保 allIngredients 和 categorizedIngredients 已初始化
    if (!allIngredients || !categorizedIngredients) {
      return [];
    }
    
    // 数据验证函数：确保食材对象有效
    const isValidIngredient = (ingredient: any) => {
      return ingredient && 
             ingredient.id && 
             ingredient.name &&
             typeof ingredient.name === 'string';
    };
    
    if (searchValue.trim()) {
      // 搜索模式：在所有食材中搜索
      return allIngredients.filter(
        ingredient =>
          isValidIngredient(ingredient) &&
          !selectedIngredients.some(selected => selected.id === ingredient.id) &&
          ingredient.name.toLowerCase().includes(searchValue.toLowerCase())
      );
    } else {
      // 分类模式：显示当前分类的食材
      const categoryIngredients = categorizedIngredients[activeCategory] || [];
      return categoryIngredients.filter(
        ingredient => 
          isValidIngredient(ingredient) &&
          !selectedIngredients.some(selected => selected.id === ingredient.id)
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
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    } else {
      setInternalActiveCategory(categoryId);
    }
    setSearchValue(""); // 清空搜索
    if (isMobile) {
      setShowCategories(false); // 在移动设备上选择分类后自动隐藏分类列表
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 当输入框有内容且按下Enter键时，将输入内容作为搜索条件
    if (e.key === 'Enter' && searchValue.trim()) {
      e.preventDefault(); // 防止表单提交

      // 先检查是否有匹配的预设食材
      const matchedIngredient = allIngredients.find(
        ingredient =>
          ingredient && ingredient.name &&
          !selectedIngredients.some(selected => selected.id === ingredient.id) &&
          ingredient.name.toLowerCase() === searchValue.toLowerCase()
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
    <div className="w-full h-full flex flex-col">
      {/* 待选食材区域 */}
      <div className="w-full flex-1 min-h-0">
        {/* 食材网格 */}
        <div className="w-full h-full">
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
            <ScrollArea className="w-full h-full">
              {filteredIngredients && filteredIngredients.length > 0 ? (
                <div className={cn("flex flex-wrap gap-2 p-3", isMobile ? "gap-2 p-3" : "gap-2 p-3")}>
                  {filteredIngredients.map((ingredient) => {
                    // 安全检查：确保 ingredient 对象和必要属性存在
                    if (!ingredient || !ingredient.name) {
                      return null; // 跳过无效的食材
                    }
                    
                    // 移除固定宽度限制，让文字宽度自适应
                    const cardWidth = 'w-auto';

                    // 构建图标路径
                    const iconPath = ingredient.slug 
                      ? `/images/ingredients-icon/${ingredient.slug}.svg`
                      : null;
                    
                    return (
                      <button
                        key={ingredient.id}
                        onClick={() => handleIngredientSelect(ingredient)}
                        className={cn(
                          "group relative rounded-2xl bg-linear-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 hover:from-[--color-primary-10] hover:via-[--color-primary-5] hover:to-[--color-primary-10] text-sm text-center transition-all duration-500 border border-gray-100 dark:border-gray-600 overflow-hidden shrink-0",
                          isMobile 
                            ? "px-3 py-2 hover:scale-105 hover:shadow-lg hover:shadow-[--color-primary-20] hover:-translate-y-0.5 active:scale-95" 
                            : "px-4 py-3 hover:scale-110 hover:shadow-xl hover:shadow-[--color-primary-25] hover:-translate-y-1",
                          cardWidth
                        )}
                      >
                        {/* 背景装饰效果 */}
                        <div className="absolute inset-0 bg-linear-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* 内容区域 */}
                        <div className="relative z-10 w-full flex items-center justify-center space-x-1">
                          {/* 图标区域 */}
                          {iconPath && (
                            <div className="shrink-0">
                              <Image
                                src={iconPath}
                                alt={ingredient.name}
                                width={30}
                                height={30}
                                className="w-[30px] h-[30px] object-contain transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  // 如果图标加载失败，隐藏图标元素
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          {/* 名称区域 */}
                          <div className={cn(
                            "font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-all duration-300 leading-tight break-words text-center flex-1 px-1",
                            isMobile ? "text-xs" : "text-xs",
                            // 如果没有图标，名称居中显示并占据更多空间
                            !iconPath ? "flex items-center justify-center h-full text-sm" : ""
                          )}>
                            {ingredient.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                // 分类为空时的提示 - 移动到食材网格中心
                <div className="flex items-center justify-center h-full">
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
                </div>
              )}
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          )}

          {/* 搜索结果为空时的提示 */}
          {!loading && filteredIngredients && filteredIngredients.length === 0 && searchValue.trim() && (
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
        </div>
      </div>
    </div>
  );
}; 