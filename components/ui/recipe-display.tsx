import { ChefHat, Users, Clock, Copy, Check, X } from "lucide-react";
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
import { toast } from "sonner";

interface RecipeDisplayProps {
  recipes: Recipe[];
  selectedIngredients: Ingredient[];
  imageLoadingStates?: Record<string, boolean>;
}

export const RecipeDisplay = ({ recipes, selectedIngredients, imageLoadingStates = {} }: RecipeDisplayProps) => {
  const t = useTranslations('recipeDisplay');
  const tImagePlaceholder = useTranslations('imagePlaceholder');
  const locale = useLocale();
  const { user, isAdmin } = useAuth();
  const { credits } = useUserUsage();
  
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
    switch (difficulty) {
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

  return (
    <div className="w-full">
      {/* Beautiful Title and Ingredients Section */}
      <div className="relative my-12 p-8 bg-gradient-to-r from-orange-50/80 via-white to-yellow-50/80 dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-800/50 rounded-2xl border border-orange-100/50 dark:border-gray-600/30 shadow-lg backdrop-blur-sm">
        {/* Decorative elements */}
        <div className="absolute top-4 right-6 opacity-10">
          <ChefHat className="h-16 w-16 text-orange-400" />
        </div>

        {/* Title - Centered */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            {t('generatedWithIngredients')}
          </h2>
        </div>

        {/* Selected Ingredients Display - Centered and smaller */}
        <div className="relative">
          <div className="flex flex-wrap justify-center gap-1.5">
            {selectedIngredients.map((ingredient, index) => (
              <Badge
                key={ingredient.id || `${ingredient.name}-${index}`}
                variant="secondary"
                className={cn(
                  "gap-1 py-0.5 text-xs animate-in fade-in slide-in-from-bottom-2",
                  ingredient.isCustom && "bg-white text-yellow-600 border-2 border-dashed border-yellow-400 hover:bg-white/90"
                )}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationDuration: '600ms'
                }}
              >
                {ingredient.englishName}
              </Badge>
            ))}
          </div>

          {/* Subtle connecting line */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-orange-300 to-transparent opacity-30"></div>
        </div>
      </div>

      {/* Recipes Section */}
      <div className="w-full bg-gradient-to-br from-gray-50/30 via-white to-orange-50/20">
        <div className="w-full mx-auto">
          <Accordion type="single" collapsible defaultValue={recipes[0]?.id || `recipe-0`}>
          {recipes.map((recipe, index) => (
            <AccordionItem
              key={recipe.id || `recipe-${index}`}
              value={recipe.id || `recipe-${index}`}
              className="bg-transparent my-0 px-0 rounded-none border-0"
            >
              <div className="w-full py-6 px-8 relative">
                {/* Custom divider line */}
                {recipes.indexOf(recipe) < recipes.length - 1 && (
                  <div 
                    key={`${recipe.id}-divider`}
                    className="absolute bottom-0 left-8 right-72 h-px bg-gray-300 dark:bg-gray-600"
                  />
                )}
                {/* Header Section - Always Visible */}
                <div className="flex justify-between items-start">
                  <div className="flex-1 max-w-3xl">
                    <AccordionTrigger className="hover:no-underline">
                      <h2 className="text-xl text-left md:text-2xl font-light hover:text-primary text-gray-700 dark:text-primary-dark mb-4 uppercase tracking-[0.2em] leading-tight">
                        {recipe.title}
                      </h2>
                    </AccordionTrigger>
                    <div className="flex items-center gap-6 text-sm dark:text-gray-700 mb-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{recipe.servings} {t('servings')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{recipe.time} {t('minutes')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4" />
                        <span>{getDifficultyLabel(recipe.difficulty)} {t('difficulty')}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-800 text-lg leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>

                  {/* Image on the right - Always Visible */}
                  <div className="ml-2 flex-shrink-0">
                    {recipe.image ? (
                      <div
                        className="w-60 h-60 cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageDialog(recipe.image!);
                        }}
                      >
                        <Image
                          src={recipe.image}
                          alt={recipe.title}
                          width={288}
                          height={288}
                          className="w-full h-full object-cover rounded-xl shadow-md"
                        />
                      </div>
                    ) : imageLoadingStates[recipe.id] ? (
                      // Loading状态
                      <div className="w-72 h-72 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-dashed border-blue-200 dark:border-gray-600 flex items-center justify-center">
                        <div className="text-center p-6">
                          <div className="text-blue-500 dark:text-blue-400 mb-3">
                            <Spinner className="w-16 h-16 mx-auto" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {locale === 'zh' ? '正在生成图片...' : 'Generating image...'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="w-72 h-72 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-dashed border-blue-200 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:bg-gradient-to-br hover:from-blue-100 hover:to-purple-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 group"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Image placeholder clicked, user:', user?.id, 'isAdmin:', isAdmin);
                          
                          // 检查用户是否登录
                          if (!user?.id) {
                            console.log('User not logged in, showing login modal');
                            // 未登录用户，显示登录模态窗口
                            const event = new CustomEvent('showLoginModal');
                            window.dispatchEvent(event);
                            return;
                          }
                          
                          console.log('User logged in, checking credits. Available credits:', credits?.credits);
                          // 已登录用户，检查积分余额
                          const availableCredits = credits?.credits || 0;
                          if (!isAdmin && availableCredits < 1) {
                            console.log('Insufficient credits, showing error');
                            // 积分不足，显示提示
                            toast.error(
                              locale === 'zh' 
                                ? '积分不足，无法生成图片' 
                                : 'Insufficient credits to generate image'
                            );
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
                        <div className="text-center p-6">
                          <div className="text-blue-500 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                            {!user?.id 
                              ? tImagePlaceholder('signInSubtitle')
                              : tImagePlaceholder('generateSubtitle')
                            }
                          </p>
                          <div className="mt-3 flex items-center justify-center text-xs text-blue-500 dark:text-blue-400">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            {!user?.id 
                              ? tImagePlaceholder('signInAction')
                              : tImagePlaceholder('generateAction')
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <AccordionContent>
                <div className="mt-8 px-8">
                  {/* Ingredients and Seasoning in same row */}
                  <div className="grid md:grid-cols-2 gap-16 mb-16">

                  {/* Ingredients */}
                  <div className="bg-green-50/30 p-6 rounded-xl border border-green-100/50">
                    <div className="flex items-center mb-8">
                      <h2 className="text-xl font-medium text-gray-900 dark:text-gray-800 tracking-wide">
                        <span>🥬</span> {t('ingredients')}
                      </h2>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              onClick={() => {
                                const recipeName = `${recipe.title}`;
                                const sectionTitle = `${t('ingredients')}:`;
                                const steps = recipe.ingredients
                                  ?.map((instr) => {
                                    const ingredientText = typeof instr === 'string' 
                                      ? instr 
                                      : (instr as { name: string; amount?: string; unit?: string }).name + 
                                        ((instr as { name: string; amount?: string; unit?: string }).amount ? ` ${(instr as { name: string; amount?: string; unit?: string }).amount}` : '') + 
                                        ((instr as { name: string; amount?: string; unit?: string }).unit ? ` ${(instr as { name: string; amount?: string; unit?: string }).unit}` : '');
                                    return `• ${ingredientText}`;
                                  })
                                  .join('\n')
                                  || '';

                                const contentToCopy = [
                                  recipeName,
                                  '',
                                  sectionTitle,
                                  steps
                                ].join('\n');

                                copyToClipboard(contentToCopy, recipe.id, 'ingredients');
                              }}
                            >
                              {copiedSection?.recipeId === recipe.id && copiedSection?.type === 'ingredients' ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('copyIngredients')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <ul className="space-y-3">
                      {recipe.ingredients?.map((ingredient, index) => {
                        // 处理不同格式的食材数据
                        const ingredientText = typeof ingredient === 'string' 
                          ? ingredient 
                          : (ingredient as { name: string; amount?: string; unit?: string }).name + 
                            ((ingredient as { name: string; amount?: string; unit?: string }).amount ? ` ${(ingredient as { name: string; amount?: string; unit?: string }).amount}` : '') + 
                            ((ingredient as { name: string; amount?: string; unit?: string }).unit ? ` ${(ingredient as { name: string; amount?: string; unit?: string }).unit}` : '');
                        
                        return (
                          <li key={`${recipe.id}-ingredient-${index}`} className="text-gray-700 dark:text-gray-800 text-base leading-relaxed">
                            <div className="flex items-start">
                              <span className="mr-3 text-green-500 font-bold text-lg leading-none">•</span>
                              <span>{ingredientText}</span>
                            </div>
                            {index < recipe.ingredients!.length - 1 && (
                              <div 
                                key={`${recipe.id}-ingredient-divider-${index}`}
                                className="w-3/4 h-px bg-gray-200/60 mt-2 ml-6"
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Seasoning */}
                  {recipe.seasoning && Array.isArray(recipe.seasoning) && recipe.seasoning.length > 0 && (
                    <div className="bg-yellow-50/30 p-6 rounded-xl border border-yellow-100/50">
                      <div className="flex items-center mb-8">
                        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-800 tracking-wide">
                          <span>🫙</span> {t('seasoning')}
                        </h2>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                                onClick={() => {
                                  const recipeName = `${recipe.title}`;
                                  const sectionTitle = `${t('seasoning')}:`;
                                  const steps = recipe.seasoning
                                    ?.map((season) => `• ${season}`)
                                    .join('\n')
                                    || '';

                                  const contentToCopy = [
                                    recipeName,
                                    '',
                                    sectionTitle,
                                    steps
                                  ].join('\n');

                                  copyToClipboard(contentToCopy, recipe.id, 'seasoning');
                                }}
                              >
                                {copiedSection?.recipeId === recipe.id && copiedSection?.type === 'seasoning' ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('copySeasoning')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <ul className="space-y-3">
                        {recipe.seasoning.map((seasoning, index) => (
                          <li key={`${recipe.id}-seasoning-${index}`} className="text-gray-700 dark:text-gray-800 text-base leading-relaxed">
                            <div className="flex items-start">
                              <span className="mr-3 text-yellow-500 font-bold text-lg leading-none">•</span>
                              <span>{seasoning}</span>
                            </div>
                            {index < recipe.seasoning.length - 1 && (
                              <div 
                                key={`${recipe.id}-seasoning-divider-${index}`}
                                className="w-3/4 h-px bg-gray-200/60 mt-2 ml-6"
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Instructions Section */}
                <div className="mt-16">

                  <div className="bg-orange-50/30 p-6 rounded-xl border border-orange-100/50">
                    <div className="flex items-center mb-8">
                      <h2 className="text-xl font-medium text-gray-900 dark:text-gray-800 tracking-wide">
                        <span>📖</span> {t('instructions')}
                      </h2>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            onClick={() => {
                              const recipeName = `${recipe.title}`;
                              const sectionTitle = `${t('instructions')}:`;
                              const steps = recipe.instructions
                                ?.map((instr, idx) => `${idx + 1}. ${instr}`)
                                .join('\n')
                                || '';

                              const contentToCopy = [
                                recipeName,
                                '',
                                sectionTitle,
                                steps
                              ].join('\n');

                              copyToClipboard(contentToCopy, recipe.id, 'instructions');
                            }}
                          >
                            {copiedSection?.recipeId === recipe.id && copiedSection?.type === 'instructions' ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('copyInstructions')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                    <div className="space-y-6 max-w-6xl">
                      {recipe.instructions?.map((instruction, index) => (
                        <div key={`${recipe.id}-instruction-${index}`} className="pb-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-sm">
                              {index + 1}
                            </div>
                            <p className="text-gray-700 dark:text-gray-800 text-base leading-relaxed pt-1">
                              {instruction}
                            </p>
                          </div>
                          {index < recipe.instructions!.length - 1 && (
                            <div 
                              key={`${recipe.id}-instruction-divider-${index}`}
                              className="w-4/5 h-px bg-gray-200/60 mt-3 ml-12"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chef Tips */}
                {recipe.chefTips && recipe.chefTips.length > 0 && (
                  <div className="mt-16">
                    <div className="bg-blue-50/30 p-6 rounded-xl border border-blue-100/50">
                      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-800 tracking-wide mb-6">
                        <span>📍</span> {t('chefTips')}
                      </h3>
                      <div className="space-y-4 max-w-4xl">
                        {Array.isArray(recipe.chefTips)
                          ? recipe.chefTips.map((tip, i) => (
                              <p key={`${recipe.id}-tip-${i}`} className="text-gray-700 dark:text-gray-800 text-base leading-relaxed italic">
                                {tip}
                              </p>
                            ))
                          : (
                              <p className="text-gray-700 dark:text-gray-800 text-base leading-relaxed italic">
                                {recipe.chefTips}
                              </p>
                            )
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* All Tags */}
                {recipe.tags && Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
                  <div className="mt-12">
                    <div className="flex flex-wrap gap-3">
                      {recipe.tags.map((tag, index) => (
                        <span
                          key={`${recipe.id}-tag-${index}`}
                          className="px-3 py-1 text-xs uppercase tracking-wide text-gray-600 dark:text-gray-700 border border-gray-300 dark:border-gray-400 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-none w-screen h-screen overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            {selectedImage && (
              <div className="relative flex items-center justify-center">
                <Image
                  src={selectedImage}
                  alt="Recipe image"
                  width={800}
                  height={800}
                  className="rounded-lg object-contain max-w-[90vw] max-h-[90vh]"
                  priority
                />
              </div>
            )}
            <Button
              className="absolute top-6 right-6 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 h-auto w-auto border border-white/20"
              onClick={() => setImageDialogOpen(false)}
            >
              <X className="h-5 w-5 text-white" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};
