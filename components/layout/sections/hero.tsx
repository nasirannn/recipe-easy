"use client";

import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { Recipe, RecipeFormData } from "@/lib/types";
import { LanguageModel, ImageModel } from "@/lib/types";
import { RecipeForm } from "@/components/ui/recipe-form";
import { RecipeDisplay } from "@/components/ui/recipe-display";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { APP_CONFIG, getRecommendedModels } from "@/lib/config";
import { useAuth } from "@/contexts/auth-context";
import { useUserUsage } from "@/hooks/use-user-usage";
import { useRecipeGeneration } from "@/hooks/use-recipe-generation";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useRecipeSave } from "@/hooks/use-recipe-save";
import { toast } from "sonner";

// 合并后的Hero Section Component
export const HeroSection = () => {
  const t = useTranslations('hero');
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const { credits } = useUserUsage();
  const canGenerateImage = (credits?.credits ?? 0) >= APP_CONFIG.imageGenerationCost;

  
  // 使用自定义 hooks
  const { 
    loading, 
    recipes, 
    error, 
    generateRecipe, 
    regenerateRecipe, 
    clearRecipes, 
    setRecipes 
  } = useRecipeGeneration();
  
  const { 
    imageGenerating, 
    imageLoadingStates,
    regenerateImage, 
    clearImageLoadingStates 
  } = useImageGeneration();
  
  const { saveRecipe } = useRecipeSave();
  
  // 根据语言获取推荐的模型
  const recommendedModels = getRecommendedModels(locale);
  
  //Recipe Form
  const [formData, setFormData] = useState<RecipeFormData>({
    ingredients: [],
    servings: 2,
    recipeCount: 1, // 固定为1个菜谱
    cookingTime: "medium",
    difficulty: "medium",
    cuisine: "any",
    languageModel: (locale === 'zh' ? 'QWENPLUS' : 'GPT4o_MINI') as LanguageModel, // 根据语言自动选择语言模型
    imageModel: (locale === 'zh' ? 'wanx' : 'flux') as ImageModel // 根据语言自动选择图片模型
  });

  // 当语言改变时，自动更新模型选择（对所有用户生效）
  useEffect(() => { setFormData(prev => ({
      ...prev,
      languageModel: (locale === 'zh' ? 'QWENPLUS' : 'GPT4o_MINI') as LanguageModel,
      imageModel: (locale === 'zh' ? 'wanx' : 'flux') as ImageModel
    }));
  }, [locale]);
  
  const [searchedIngredients, setSearchedIngredients] = useState<RecipeFormData['ingredients']>([]);
  const [showRecipe, setShowRecipe] = useState(false);

  // 新增：Tab栏状态
  const [activeTab, setActiveTab] = useState<'recipe-maker' | 'meal-planner'>('recipe-maker');
  const [mealPlannerText, setMealPlannerText] = useState('');

  // 监听loading状态变化，当loading结束且有recipe时，自动滚动到recipe-display顶部
  useEffect(() => {
    // 当loading从true变为false，且有recipe数据时，滚动到recipe-display
    if (!loading && recipes.length > 0 && showRecipe) {
      const timer = setTimeout(() => {
        const recipeDisplayContainer = document.querySelector('.recipe-display-container');
        if (recipeDisplayContainer) {
          recipeDisplayContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 200); // 稍微增加延迟，确保RecipeDisplay完全渲染

      return () => clearTimeout(timer);
    }
  }, [loading, recipes.length, showRecipe]); // 监听loading状态、recipes数量和showRecipe状态

  // 监听重新生成菜谱事件
  const handleRegenerateRecipe = useCallback(async (event: CustomEvent) => {
    const { ingredients, recipe } = event.detail;
    
    // 设置表单数据
    setFormData(prev => ({
      ...prev,
      ingredients: ingredients
    }));
    
    // 滚动到loading动画位置
    setTimeout(() => {
      const loadingContainer = document.getElementById('loading-animation-container');
      if (loadingContainer) {
        loadingContainer.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
    
    try {
      const generatedRecipes = await regenerateRecipe(ingredients, recipe, {
        ingredients: ingredients,
        servings: 2,
        recipeCount: 1,
        cookingTime: "medium",
        difficulty: "medium",
        cuisine: "any",
        languageModel: (locale === 'zh' ? 'QWENPLUS' : 'GPT4o_MINI') as LanguageModel,
        imageModel: (locale === 'zh' ? 'wanx' : 'flux') as ImageModel
      });
      setSearchedIngredients(ingredients);
      
      if (generatedRecipes.length > 0) {
        setShowRecipe(true);
      }
    } catch (error) {
      // Regenerate recipe error
    }
  }, [regenerateRecipe, locale]);

  useEffect(() => {
    window.addEventListener('regenerateRecipe', handleRegenerateRecipe as EventListener);
    
    return () => {
      window.removeEventListener('regenerateRecipe', handleRegenerateRecipe as EventListener);
    };
  }, [handleRegenerateRecipe]);

  const handleFormChange = (data: RecipeFormData) => {
    setFormData(data);
  };

  // 重新生成单个菜谱的图片
  const handleRegenerateImage = async (recipeId: string, recipe: Recipe) => {
    // 检查用户登录状态
    if (!user?.id) {
      toast.error(locale === 'zh' ? '请先登录以生成图片' : 'Please login to generate images');
      return;
    }

    // 检查积分余额
    if (!canGenerateImage) {
      toast.error(
        locale === 'zh' 
          ? `积分不足，无法重新生成图片。每次生成需要 ${APP_CONFIG.imageGenerationCost} 个积分。`
          : `Insufficient credits to regenerate image. Each generation requires ${APP_CONFIG.imageGenerationCost} credits.`
      );
      return;
    }

    try {
      await regenerateImage(recipeId, recipe, formData.imageModel, (imageUrl) => {
        setRecipes(prevRecipes => prevRecipes.map(r => 
          r.id === recipeId 
            ? { ...r, imagePath: imageUrl }
            : r
        ));
        
        // 显示成功提示
        toast.success(
          locale === 'zh' 
            ? `图片重新生成成功！已消耗 ${APP_CONFIG.imageGenerationCost} 个积分。`
            : `Image regenerated successfully! ${APP_CONFIG.imageGenerationCost} credits consumed.`
        );
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
        (locale === 'zh' ? '图片重新生成失败，请稍后重试' : 'Failed to regenerate image, please try again');
      
      toast.error(errorMessage);
      // Regenerate image error
    }
  };

  // 清除菜谱和图片加载状态
  const handleClearRecipes = useCallback(() => {
    if (user?.id) {
      clearRecipes();
      clearImageLoadingStates();
      
      // 重置表单数据到初始状态
      setFormData({
        ingredients: [],
        servings: 2,
        recipeCount: 1,
        cookingTime: "medium",
        difficulty: "medium",
        cuisine: "any",
        languageModel: (locale === 'zh' ? 'QWENPLUS' : 'GPT4o_MINI') as LanguageModel,
        imageModel: (locale === 'zh' ? 'wanx' : 'flux') as ImageModel
      });
    }
  }, [user, locale, clearRecipes, clearImageLoadingStates]);

  const handleSubmit = async () => {
    try {
      const generatedRecipes = await generateRecipe(formData);
      setSearchedIngredients(formData.ingredients);
      
      if (generatedRecipes.length > 0) {
        setShowRecipe(true);
      }
    } catch (error) {
      // Recipe generation failed
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      await saveRecipe(recipe, user?.id);
      // 显示保存成功提示
      toast.success(
        locale === 'zh' 
          ? '菜谱保存成功！' 
          : 'Recipe saved successfully!'
      );
    } catch (error) {
      // Error saving recipe
      const errorMessage = error instanceof Error ? error.message : 
        (locale === 'zh' ? '保存菜谱失败，请稍后重试' : 'Failed to save recipe, please try again');
      toast.error(errorMessage);
    }
  };
  return (
    <section id="hero" className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-36 left-[-18%] h-[28rem] w-[28rem] rounded-full bg-blue-400/18 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute -top-40 right-[-14%] h-[30rem] w-[30rem] rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/18" />
      </div>

      <div className="relative z-10 home-inner pb-20 pt-24 sm:pt-28 md:pb-24 md:pt-32">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="home-eyebrow">
              {locale === 'zh' ? 'AI 食谱工作台' : 'AI Recipe Workspace'}
            </span>
            <h1 className="home-title mx-auto mt-4 max-w-3xl">
              {locale === 'zh' ? (
                <>
                  用任意食材，
                  <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent"> 生成 AI 食谱</span>
                </>
              ) : (
                <>
                  Turn Any Ingredients Into
                  <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent"> AI Recipes</span>
                </>
              )}
            </h1>
            <p className="home-lead mx-auto mt-3 max-w-3xl">
              {t('description')}
            </p>

            <div className="mx-auto mt-4 flex w-full max-w-5xl flex-wrap items-center justify-center gap-2 px-1 sm:mt-5">
              {[t('badgeFreeRecipeCreation'), t('badgeRegisterForImages'), t('badgeStartWithCredits'), t('badgeImageCostPerCredit')].map((item) => (
                <div
                  key={item}
                  className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200/80 bg-white/72 px-3 py-1.5 text-left text-xs font-medium leading-5 text-slate-700 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/46 dark:text-slate-300 sm:text-[13px]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="recipe-form-section" className="mt-7 sm:mt-8">
            <div className="home-card relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none dark:opacity-5">
                <Image
                  src="/images/ingredients-icon/grain-texture.png"
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized={true}
                />
              </div>

              <div className="relative z-10 p-4 md:p-6">
                <RecipeForm
                  formData={formData}
                  onFormChange={handleFormChange}
                  onSubmit={handleSubmit}
                  loading={loading || imageGenerating}
                  showRecipe={showRecipe}
                  setShowRecipe={setShowRecipe}
                  activeTab={activeTab}
                  mealPlannerText={mealPlannerText}
                />
              </div>
            </div>
          </div>

          {showRecipe && activeTab === 'recipe-maker' && (
            <div id="loading-animation-container" className="mt-8">
              {loading ? (
                <LoadingAnimation language={locale as 'en' | 'zh'} />
              ) : (
                <RecipeDisplay
                  recipes={recipes}
                  selectedIngredients={searchedIngredients}
                  imageLoadingStates={imageLoadingStates}
                  onRegenerateImage={handleRegenerateImage}
                  onSaveRecipe={handleSaveRecipe}
                />
              )}
              {error && (
                <div className="mx-auto mt-6 max-w-screen-md rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
