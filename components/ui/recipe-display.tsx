import { ChefHat, Users, Clock, Copy, Check, X } from "lucide-react";
import { Recipe } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Badge } from "./badge";
import Image from "next/image";
import { Spinner } from "./spinner";
import { Dialog, DialogContent } from "./dialog";

interface RecipeDisplayProps {
  recipes: Recipe[];
  selectedIngredients: string[];
}

export const RecipeDisplay = ({ recipes, selectedIngredients }: RecipeDisplayProps) => {
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
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
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
    <div className="w-full mx-auto bg-transparent py-4 sm:py-8">
      <div className="wu-full mx-auto space-y-16">
        <Accordion type="single" collapsible defaultValue={recipes[0]?.id}>
          {recipes.map((recipe) => (
            <AccordionItem
              key={recipe.id}
              value={recipe.id}
              className="bg-white dark:bg-gray-50 p-12 shadow-sm sm:shadow-md rounded-lg border-0 my-6"
            >
              <div className="w-full">
                {/* Header Section - Always Visible */}
                <div className="flex justify-between items-start">
                  <div className="flex-1 max-w-3xl">
                    <AccordionTrigger className="hover:no-underline">
                      <h1 className="text-xl text-left md:text-2xl font-light hover:text-primary text-gray-700 dark:text-primary-dark mb-4 uppercase tracking-[0.2em] leading-tight">
                        {recipe.title}
                      </h1>
                    </AccordionTrigger>
                    <div className="flex items-center gap-6 text-sm dark:text-gray-700 mb-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{recipe.servings} servings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{recipe.time} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4" />
                        <span>{recipe.difficulty} difficulty</span>
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
                        className="w-74 h-74 cursor-pointer hover:scale-105 transition-transform duration-300"
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
                          className="w-full h-full object-cover rounded-lg shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="w-72 h-72 bg-gray-100 dark:bg-gray-200 rounded-lg flex items-center justify-center">
                        <Spinner />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <AccordionContent>
                <div className="max-w-3xl h-px bg-gray-300 dark:bg-gray-400 mb-6"></div>

                {/* Ingredients and Seasoning in same row */}
                <div className="grid md:grid-cols-2 gap-16 mb-16">

                  {/* Ingredients */}
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-medium text-gray-900 dark:text-gray-800 tracking-wide">
                        <span>🥬</span> Ingredients
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
                                const sectionTitle = "Ingredients:";
                                const steps = recipe.ingredients
                                  ?.map((instr) => `• ${instr}`)
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
                            <p>Copy ingredients</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <ul className="space-y-3">
                      {recipe.ingredients?.map((ingredient, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-800 text-base leading-relaxed flex">
                          <span className="mr-3 text-gray-400">•</span>
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Seasoning */}
                  {recipe.seasoning && recipe.seasoning.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-800 tracking-wide">
                          <span>🫙</span> Seasoning
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
                                  const sectionTitle = "Seasoning:";
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
                              <p>Copy seasoning</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <ul className="space-y-3">
                        {recipe.seasoning.map((seasoning, index) => (
                          <li key={index} className="text-gray-700 dark:text-gray-800 text-base leading-relaxed flex">
                            <span className="mr-3 text-gray-400">•</span>
                            <span>{seasoning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Instructions Section */}
                <div className="mt-16">
                  <div className="w-full h-px bg-gray-300 dark:bg-gray-400 mb-8"></div>

                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-medium text-gray-900 dark:text-gray-800 tracking-wide">
                      <span>📖</span> Instructions
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
                              const sectionTitle = "Instructions:";
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
                          <p>Copy instructions</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="space-y-6 max-w-4xl">
                    {recipe.instructions?.map((instruction, index) => (
                      <p key={index} className="text-gray-700 dark:text-gray-800 text-base leading-relaxed">
                        <span className="font-medium mr-2">{index + 1}.</span>
                        {instruction}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Chef Tips */}
                {recipe.chefTips && recipe.chefTips.length > 0 && (
                  <div className="mt-16">
                    <div className="w-full h-px bg-gray-300 dark:bg-gray-400 mb-8"></div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-800 tracking-wide mb-6">
                      <span>📍</span> Chef Tips
                    </h3>
                    <div className="space-y-4 max-w-4xl">
                      {recipe.chefTips.map((tip, i) => (
                        <p key={i} className="text-gray-700 dark:text-gray-800 text-base leading-relaxed italic">
                          {tip}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Tags */}
                {recipe.tags && recipe.tags.length > 3 && (
                  <div className="mt-12">
                    <div className="flex flex-wrap gap-3">
                      {recipe.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-xs uppercase tracking-wide text-gray-600 dark:text-gray-700 border border-gray-300 dark:border-gray-400 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
  );
}; 
