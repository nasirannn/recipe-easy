import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { ingredients, Ingredient } from "@/lib/constants/ingredients";
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

// 食材分类
export const CATEGORIES = {
  meat: {
    id: 'meat',
    name: '肉类',
    englishName: 'Meat',
    icon: Beef
  },
  seafood: {
    id: 'seafood',
    name: '海鲜',
    englishName: 'Seafood',
    icon: Fish
  },
  vegetable: {
    id: 'vegetable',
    name: '蔬菜',
    englishName: 'Vegetables',
    icon: Carrot
  },
  fruit: {
    id: 'fruit',
    name: '水果',
    englishName: 'Fruits',
    icon: Apple
  },
  dairy: {
    id: 'dairy',
    name: '奶制品和蛋类',
    englishName: 'Dairy & Eggs',
    icon: Milk
  },
  grains: {
    id: 'grains',
    name: '谷物和面包',
    englishName: 'Grains & Bread',
    icon: Cookie
  },
  nuts: {
    id: 'nuts',
    name: '坚果和种子',
    englishName: 'Nuts & Seeds',
    icon: Nut
  },
  herbs: {
    id: 'herbs',
    name: '香草和香料',
    englishName: 'Herbs & Spices',
    icon: Flower
  },
  condiments: {
    id: 'condiments',
    name: '调味品和酱料',
    englishName: 'Oils & Condiments',
    icon: Sandwich
  }
} as const;

// 食材分类
const CATEGORIZED_INGREDIENTS = {
  meat: ingredients.slice(0, 12),
  seafood: ingredients.slice(12, 26),
  vegetable: ingredients.slice(26, 50),
  fruit: ingredients.slice(50, 72),
  dairy: ingredients.slice(72, 79),
  grains: ingredients.slice(79, 85),
  nuts: ingredients.slice(85, 90),
  herbs: ingredients.slice(90, 100),
  condiments: ingredients.slice(100, 106)
};

// 按字母表排序的食材
const ALPHABETICAL_INGREDIENTS = [...ingredients].sort((a, b) =>
  a.englishName.localeCompare(b.englishName)
);

export const IngredientSelector = ({
  selectedIngredients,
  onIngredientSelect,
  onIngredientRemove,
  onClearAll,
}: IngredientSelectorProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = React.useState<keyof typeof CATEGORIES>('meat');
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setShowFloatingButton(scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // 浮动按钮点击处理
  const focusSearchInput = () => {
    inputRef.current?.focus();
    // 滚动到顶部
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  // 处理搜索输入
  useEffect(() => {
    if (searchValue.trim()) {
      const filtered = ingredients.filter(
        ingredient => 
          !selectedIngredients.some(selected => selected.id === ingredient.id) && 
          (ingredient.englishName.toLowerCase().includes(searchValue.toLowerCase()) ||
           ingredient.name.toLowerCase().includes(searchValue.toLowerCase()))
      );
      setFilteredIngredients(filtered); // 移除数量限制
    } else {
      // 当搜索为空时，显示当前分类的食材
      const categoryIngredients = CATEGORIZED_INGREDIENTS[activeCategory] || [];
      setFilteredIngredients(
        categoryIngredients.filter(
          ingredient => !selectedIngredients.some(selected => selected.id === ingredient.id)
        ) // 移除数量限制
      );
    }
  }, [searchValue, selectedIngredients, activeCategory, isMobile]);

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

  // 处理键盘事件，支持Backspace删除最后一个食材，支持Enter添加搜索文本为食材
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 当输入框为空且按下Backspace键时，删除最后一个食材
    if (e.key === 'Backspace' && !searchValue && selectedIngredients.length > 0) {
      e.preventDefault(); // 防止默认行为
      const lastIngredient = selectedIngredients[selectedIngredients.length - 1];
      handleRemoveIngredient(lastIngredient);
    }
    
    // 当输入框有内容且按下Enter键时，将输入内容作为搜索条件
    if (e.key === 'Enter' && searchValue.trim()) {
      e.preventDefault(); // 防止表单提交
      
      // 先检查是否有匹配的预设食材
      const matchedIngredient = ingredients.find(
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
          category: 'other',
          isCustom: true
        };
        
        onIngredientSelect(customIngredient);
        setSearchValue(''); // 清空搜索框
      }
    }
  };

  // 清空所有已选食材
  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      // 如果没有提供onClearAll回调，则逐个删除
      [...selectedIngredients].forEach(ingredient => {
        if (onIngredientRemove) {
          onIngredientRemove(ingredient);
        }
      });
    }
    setSearchValue(''); // 清空搜索框
    inputRef.current?.focus(); // 聚焦到输入框
    setIsDialogOpen(false); // 关闭确认对话框
  };

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
              placeholder={selectedIngredients.length > 0 ? "Add more ingredients..." : "select or enter ingredients..."}
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
                    <span className="sr-only">Clear all</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Clear all ingredients?</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to remove all selected ingredients? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleClearAll}>
                      Remove All
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* 分类选择器 - 移动设备上是一个下拉菜单，桌面设备上是一行按钮 */}
      <div className="w-full">
        {isMobile ? (
          <div className="relative">
            <button 
              onClick={() => setShowCategories(!showCategories)}
              className="w-full flex items-center justify-between p-2 border rounded-lg text-sm"
            >
              <span>Category: {CATEGORIES[activeCategory].englishName}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
            </button>
            
            {showCategories && (
              <div className="absolute z-10 mt-1 w-full bg-background border rounded-lg shadow-lg">
                {Object.entries(CATEGORIES).map(([categoryId, category]) => (
                  <button
                    key={categoryId}
                    onClick={() => handleCategoryChange(categoryId as keyof typeof CATEGORIES)}
                    className={`w-full text-left p-2.5 text-sm hover:bg-muted ${activeCategory === categoryId ? 'bg-primary/10 text-primary font-medium' : ''}`}
                  >
                    {category.englishName}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between overflow-x-auto pb-1 hide-scrollbar">
            {Object.entries(CATEGORIES).map(([categoryId, category]) => {
              const Icon = category.icon;
              return (
                <button
                  key={categoryId}
                  onClick={() => handleCategoryChange(categoryId as keyof typeof CATEGORIES)}
                  className={cn(
                    "flex items-center px-3 py-1.5 text-sm whitespace-nowrap rounded-lg mr-2 transition-colors",
                    activeCategory === categoryId
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {category.englishName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 食材推荐网格 */}
      <div className="w-full">
        {filteredIngredients.length > 0 ? (
          <ScrollArea className="h-64 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredIngredients.map((ingredient) => (
                <button
                  key={ingredient.id}
                  onClick={() => handleIngredientSelect(ingredient)}
                  className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-center transition-colors"
                >
                  {ingredient.englishName}
                </button>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        ) : (
          searchValue.trim() && (
            <div className="text-sm text-muted-foreground p-4 text-center bg-muted/30 rounded-lg">
              No matching ingredients found.<br />Press Enter to add "{searchValue}" as a search term.
            </div>
          )
        )}
      </div>

      {/* 添加样式以隐藏滚动条但保留功能 */}
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
}; 
