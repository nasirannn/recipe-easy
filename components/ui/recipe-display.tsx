import { ChefHat, Users, Clock, Copy, Check, X, RefreshCw, Save, Loader2, Bookmark } from "lucide-react";
import { Recipe, Ingredient } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Badge } from "./badge";
import Image from "next/image";
import { Spinner } from "./spinner";
import { Dialog, DialogContent } from "./dialog";
import { useTranslations, useLocale } from 'next-intl';
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useUserUsage } from "@/hooks/use-user-usage";

import { Card, CardContent } from "./card";
import { Separator } from "./separator";

interface RecipeDisplayProps {
  recipes: Recipe[];
  selectedIngredients: Ingredient[];
  imageLoadingStates?: Record<string, boolean>;
  onRegenerateImage?: (recipeId: string, recipe: Recipe) => void;
  onSaveRecipe?: (recipe: Recipe) => Promise<void>;
}

export const RecipeDisplay = ({ recipes, selectedIngredients, imageLoadingStates = {}, onRegenerateImage, onSaveRecipe }: RecipeDisplayProps) => {
  const t = useTranslations('recipeDisplay');
  const tImagePlaceholder = useTranslations('imagePlaceholder');
  const locale = useLocale();
  const { user, isAdmin } = useAuth();
  const { credits } = useUserUsage();
  
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  
  const [activeItemId, setActiveItemId] = useState<string | undefined>(
    recipes.find(r => r.recommended)?.id || (recipes.length > 0 ? recipes[0].id : undefined)
  );

  const [copiedSection, setCopiedSection] = useState<{recipeId: string, type: 'ingredients' | 'seasoning' | 'instructions'} | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const defaultActiveId = recipes.find(r => r.recommended)?.id || (recipes.length > 0 ? recipes[0].id : undefined);
    setActiveItemId(defaultActiveId);
  }, [recipes]);

  const getDifficultyLabel = (difficulty: string) => {
    // 如果是中文难度等级，直接返回
    if (difficulty === '简单' || difficulty === '中等' || difficulty === '困难') {
      return difficulty;
    }
    // 如果是英文难度等级，根据语言返回对应翻译
    switch (difficulty.toLowerCase()) {
      case 'easy': return t('easy');
      case 'medium': return t('medium');
      case 'hard': return t('hard');
      default: return difficulty;
    }
  };



  // 复制文本到剪贴板
  const copyToClipboard = async (text: string, recipeId: string, type: 'ingredients' | 'seasoning' | 'instructions') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection({recipeId, type});
      
      // 3秒后重置复制状态
      setTimeout(() => {
        setCopiedSection(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // 打开图片查看对话框
  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  // 解析JSON字符串为数组
  const parseJsonArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        return [];
      }
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Recipes Section */}
        <div className="space-y-8">
          {recipes.map((recipe, index) => {
            // 解析数据
            const ingredients = parseJsonArray(recipe.ingredients);
            const seasoning = parseJsonArray(recipe.seasoning);
            const instructions = parseJsonArray(recipe.instructions);
            const chefTips = parseJsonArray(recipe.chefTips);
            const tags = parseJsonArray(recipe.tags);

            return (
              <div key={recipe.id || `recipe-${index}`} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 左侧：图片和基本信息 */}
                <div className="lg:col-span-2 space-y-6">
                  {/* 主图片 */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl group">
                    {recipe.imagePath && !imageErrors[recipe.id] ? (
                      <Image
                        src={recipe.imagePath}
                        alt={recipe.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                        unoptimized={true}
                        onClick={() => openImageDialog(recipe.imagePath!)}
                        onError={(e) => {
                          console.error('Image load error for recipe:', recipe.id, e);
                          setImageErrors(prev => ({ ...prev, [recipe.id]: true }));
                        }}
                      />
                    ) : imageLoadingStates[recipe.id] ? (
                      // Loading状态 - 与默认状态保持一致的样式
                      <div className="w-full h-full relative pointer-events-none overflow-hidden">
                        {/* 背景图片 - 添加高斯模糊 */}
                        <Image
                          src="/images/recipe-placeholder-bg.png"
                          alt="Background"
                          fill
                          className="object-cover blur-sm scale-110"
                          unoptimized={true}
                        />
                        
                        {/* 渐变遮罩层 - 与默认状态保持一致 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/5 to-black/15" />
                        
                        {/* 加载状态 - 中央位置，简洁明了 */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="h-16 w-16 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/30">
                            <RefreshCw className="h-8 w-8 text-gray-700 animate-spin" />
                          </div>
                        </div>
                        
                        {/* 底部文字提示 */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
                            <p className="text-white text-sm font-medium">
                              {locale === 'zh' ? '正在生成图片...' : 'Generating image...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 默认状态 - 优化后的简洁设计
                      <div className="w-full h-full relative group overflow-hidden cursor-pointer">
                        {/* 背景图片 - 保持recipe-placeholder-bg.png */}
                        <Image
                          src="/images/recipe-placeholder-bg.png"
                          alt="Recipe placeholder background"
                          fill
                          className="object-cover transition-all duration-500 group-hover:scale-105 blur-sm"
                          unoptimized={true}
                        />
                        
                        {/* 渐变遮罩层 - 与加载状态保持一致 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-black/15 via-black/10 to-black/20" />
                        
                        {/* 中央交互区域 */}
                        <div 
                          className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-300"
                          onClick={() => {
                            console.log('Generate button clicked, user:', user?.id, 'isAdmin:', isAdmin);
                            
                            // 检查用户是否登录
                            if (!user?.id) {
                              console.log('User not logged in, showing login modal');
                              const event = new CustomEvent('showLoginModal');
                              window.dispatchEvent(event);
                              return;
                            }
                            
                            console.log('User logged in, checking credits. Available credits:', credits?.credits);
                            // 已登录用户，检查积分余额
                            const availableCredits = credits?.credits || 0;
                            if (!isAdmin && availableCredits < 1) {
                              console.log('Insufficient credits, showing error');
                              return;
                            }
                            
                            console.log('Credits sufficient, dispatching generateImage event for recipe:', recipe.title);
                            // 积分充足，触发生成图片事件
                            const event = new CustomEvent('generateImage', { 
                              detail: { recipeId: recipe.id, recipe: recipe } 
                            });
                            window.dispatchEvent(event);
                          }}
                        >
                          {/* 主生成按钮 - 与加载状态保持一致的大小和样式 */}
                          <div className="relative">
                            {/* 主按钮 - 使用与加载状态相同的尺寸 */}
                            <div className="h-16 w-16 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/30 group-hover:scale-105 transition-all duration-300">
                              <RefreshCw className="h-8 w-8 text-gray-700 group-hover:rotate-12 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                        
                        {/* 底部提示 */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-gray-700 font-medium">
                            {locale === 'zh' ? '消耗1积分生成菜谱图片' : 'Cost 1 credit to generate recipe image'}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 重新生成按钮 - 只在已生成图片时显示，悬停时显示 */}
                    {onRegenerateImage && recipe.imagePath && !imageErrors[recipe.id] && !imageLoadingStates[recipe.id] && (
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div 
                          className="relative h-12 w-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl border border-white/30 cursor-pointer hover:bg-white transition-colors duration-200 hover:scale-110 group/button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRegenerateImage(recipe.id, recipe);
                          }}
                          title={locale === 'zh' ? '重新生成图片需消耗1积分' : 'Regenerate image costs 1 credit'}
                        >
                          <RefreshCw className="h-6 w-6 text-gray-700 hover:rotate-180 transition-transform duration-300" />
                          
                          {/* 悬浮提示 - 显示积分消耗信息 */}
                          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap shadow-lg">
                              {locale === 'zh' ? '重新生成图片需消耗1积分' : 'Regenerate image costs 1 credit'}
                              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 标题和描述 */}
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                      {recipe.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      {recipe.description}
                    </p>
                    
                    {/* 标签 - 简约性冷淡风格 */}
                    {tags.length > 0 && (
                      <div className="pt-2">
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, i) => (
                            <div key={i} className="tag-minimal">
                              <span className="text-[10px]">🏷️</span>
                              <span>{tag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 烹饪信息卡片 */}
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recipe.cookingTime && (
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-xl">
                              <Clock className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('cookTime')}</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {recipe.cookingTime} {t('mins')}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {recipe.servings && (
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-xl">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('serves')}</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {recipe.servings}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {recipe.difficulty && (
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-xl">
                              <ChefHat className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('difficulty')}</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {getDifficultyLabel(recipe.difficulty)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 食材和调料 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 食材 */}
                    {ingredients.length > 0 && (
                      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <span className="text-2xl">🥬</span>
                              {t('ingredients')}
                            </h3>

                          </div>
                          <ul className="space-y-2">
                            {ingredients?.map((ingredient, i) => (
                              <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                                <span>{ingredient}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* 调料 */}
                    {seasoning.length > 0 && (
                      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <span className="text-2xl">🧂</span>
                              {t('seasoning')}
                            </h3>

                          </div>
                          <ul className="space-y-2">
                            {seasoning?.map((season, i) => (
                              <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0" />
                                <span>{season}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* 烹饪步骤 */}
                  {instructions.length > 0 && (
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="text-2xl">📝</span>
                            {t('instructions')}
                          </h3>

                        </div>
                        <div className="space-y-6">
                          {instructions?.map((step, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center font-semibold text-sm">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{step}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 厨师小贴士 */}
                  {chefTips.length > 0 && (
                    <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2">
                            <span className="text-2xl">👩‍🍳</span>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t('chefTips')}
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {chefTips?.map((tip, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2" />
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{tip}</p>
                            </div>
                          ))}
                        </div>
                        
                        {/* AI生成内容说明 */}
                        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            {t('aiContentNotice')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* 右侧：快速信息和保存按钮 */}
                <div className="space-y-6">
                  {/* 快速信息卡片 */}
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg sticky top-24">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('quickInfo')}
                      </h3>
                      <div className="space-y-4">
                        {recipe.cookingTime && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('cookTime')}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {recipe.cookingTime} {t('mins')}
                            </span>
                          </div>
                        )}
                        {recipe.servings && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('serves')}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {recipe.servings}
                            </span>
                          </div>
                        )}
                        {recipe.difficulty && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('difficulty')}</span>
                            <span className="font-semibold px-2 py-1 rounded-md text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800">
                              {getDifficultyLabel(recipe.difficulty)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      {/* 保存按钮 */}
                      {onSaveRecipe && (
                        <div className="space-y-3">
                          <Button
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                            disabled={savingStates[recipe.id]}
                            onClick={async () => {
                              if (!user?.id) {
                                return;
                              }
                              
                              setSavingStates(prev => ({ ...prev, [recipe.id]: true }));
                              try {
                                await onSaveRecipe(recipe);
                                // 成功提示将在 onSaveRecipe 内部处理
                              } catch (error) {
                                console.error('Save recipe error:', error);
                              } finally {
                                setSavingStates(prev => ({ ...prev, [recipe.id]: false }));
                              }
                            }}
                          >
                            {savingStates[recipe.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Bookmark className="h-4 w-4 mr-2" />
                            )}
                            {t('saveRecipe')}
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => {
                              const allContent = [
                                recipe.title,
                                '',
                                recipe.description,
                                '',
                                `${t('ingredients')}:`,
                                ...(ingredients?.map(ingredient => `• ${ingredient}`) || []),
                                '',
                                `${t('seasoning')}:`,
                                ...(seasoning?.map(season => `• ${season}`) || []),
                                '',
                                `${t('instructions')}:`,
                                ...(instructions?.map((instr, idx) => `${idx + 1}. ${instr}`) || []),
                                '',
                                `${t('chefTips')}:`,
                                ...(chefTips?.map(tip => `• ${tip}`) || [])
                              ].join('\n');
                              copyToClipboard(allContent, recipe.id, 'ingredients');
                            }}
                          >
                            {copiedSection?.recipeId === recipe.id && copiedSection?.type === 'ingredients' ? (
                              <Check className="w-4 h-4 mr-2 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 mr-2" />
                            )}
                            {t('copyFullRecipe')}
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => {
                              // 触发重新生成事件
                              const event = new CustomEvent('regenerateRecipe', { 
                                detail: { 
                                  ingredients: selectedIngredients,
                                  recipe: recipe 
                                } 
                              });
                              window.dispatchEvent(event);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {t('regenerate')}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
          <div className="relative">
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Recipe"
                width={800}
                height={600}
                className="w-full h-auto rounded-lg shadow-2xl"
                unoptimized={true}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30"
              onClick={() => setImageDialogOpen(false)}
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
