"use client"

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { IngredientSelector } from "./ingredients-selector";
import { Sliders, Clock, Users, Gauge, Globe, Sparkles, Image as ImageIcon, X } from "lucide-react";
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
import { RecipeFormData } from "@/lib/types";
import { ImageModel } from "@/lib/config";

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
  const tCredits = useTranslations('credits');
  const locale = useLocale();
  
  // 获取推荐模型配置
  const recommendedModels = getRecommendedModels(locale);
  
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
    <div className="w-full flex flex-col gap-3 sm:gap-4">
      {/* 食材选择与输入集成区域 */}
      <div className="relative w-full mx-auto rounded-lg sm:rounded-xl bg-white/80 dark:bg-black/20 backdrop-blur-sm p-3 sm:p-4 shadow-sm sm:shadow-md">
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
          onClearAll={() => {
            onFormChange({ ...formData, ingredients: [] });
          }}
        />
        {/* 生成按钮和高级设置 */}
        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 border-t border-muted/20">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs flex gap-1.5 h-7 px-2 sm:px-3">
                  <Sliders className="h-3 w-3" />
                  <span className="hidden sm:inline-block">{t('moreOptions')}</span>
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
                  <h3 className="text-sm font-medium">{t('moreOptions')}</h3>
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
                      onValueChange={(value) => onFormChange({ ...formData, cookingTime: value })}
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
                      value={formData.languageModel || recommendedModels.languageModel}
                      onValueChange={value => onFormChange({ ...formData, languageModel: value as 'DEEPSEEK' | 'QWENPLUS' | 'GPT4o_MINI' })}
                      className="grid grid-cols-1 gap-3"
                    >
                      <div className={`flex flex-col gap-2 border rounded-lg p-3 ${(formData.languageModel || recommendedModels.languageModel) === 'DEEPSEEK' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'}`}>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="DEEPSEEK" id="lm-deepseek" />
                          <Label htmlFor="lm-deepseek" className="font-medium cursor-pointer">Deepseek</Label>
                        </div>
                        <div className="text-xs text-muted-foreground pl-6">
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Cost-effective</li>
                            <li>Supports Chinese & English</li>
                            <li>Fast response</li>
                          </ul>
                        </div>
                      </div>
                      <div className={`flex flex-col gap-2 border rounded-lg p-3 ${(formData.languageModel || recommendedModels.languageModel) === 'QWENPLUS' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'}`}>
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
                      <div className={`flex flex-col gap-2 border rounded-lg p-3 ${(formData.languageModel || recommendedModels.languageModel) === 'GPT4o_MINI' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'}`}>
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
                      value={formData.imageModel || recommendedModels.imageModel}
                      onValueChange={value => handleModelChange(value as ImageModel)}
                      className="grid grid-cols-1 gap-3"
                    >
                      <div className={`flex flex-col gap-2 border rounded-lg p-3 ${(formData.imageModel || recommendedModels.imageModel) === 'wanx' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'}`}>
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
                      
                      <div className={`flex flex-col gap-2 border rounded-lg p-3 ${(formData.imageModel || recommendedModels.imageModel) === 'flux' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'}`}>
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
            <Button
              onClick={handleGenerateClick}
              className={cn(
                "font-medium",
                isMobile
                  ? "w-full text-center max-w-[200px] px-6"
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
      {/* 登录模态框 */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}; 