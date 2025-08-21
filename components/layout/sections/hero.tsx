"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from "react";
import { Rocket, Compass } from "lucide-react";
import { Recipe, RecipeFormData } from "@/lib/types";
import { LanguageModel, ImageModel } from "@/lib/types";
import { RecipeForm } from "@/components/ui/recipe-form";
import { RecipeDisplay } from "@/components/ui/recipe-display";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { getRecommendedModels } from "@/lib/config";
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
  const isAdmin = user?.user_metadata?.role === 'admin';
  const { canGenerate } = useUserUsage();

  
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

  // 监听重新生成菜谱事件
  const handleRegenerateRecipe = useCallback(async (event: CustomEvent) => {
    const { ingredients, recipe } = event.detail;
    
    // 设置表单数据
    setFormData(prev => ({
      ...prev,
      ingredients: ingredients
    }));
    
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

    // 检查积分余额（管理员跳过）
    if (!isAdmin && !canGenerate) {
      toast.error(
        locale === 'zh' 
          ? '积分不足，无法重新生成图片。每次生成需要 1 个积分。' 
          : 'Insufficient credits to regenerate image. Each generation requires 1 credit.'
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
            ? '图片重新生成成功！已消耗 1 个积分。' 
            : 'Image regenerated successfully! 1 credit consumed.'
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
      await saveRecipe(recipe, formData.imageModel);
    } catch (error) {
      // Error saving recipe
    }
  };

  // 新增：处理tab切换
  const handleTabChange = (tab: 'recipe-maker' | 'meal-planner') => {
    setActiveTab(tab);
  };

  // 新增：处理meal planner文本变更
  const handleMealPlannerTextChange = (text: string) => {
    setMealPlannerText(text);
  };

  // 新增：处理meal planner清空
  const handleMealPlannerClear = () => {
    setMealPlannerText('');
  };

  // 新增：处理meal planner提交
  const handleMealPlannerSubmit = () => {
    // 这里可以添加实际的提交逻辑
  };

  return (
    <section id="hero" className="w-full bg-primary-5">
      {/* 第一个div: Hero Intro Section */}
      <div className="w-full pb-8 lg:pb-0 h-[calc(100vh-3.5rem)] flex items-center relative">
        {/* 背景图片容器 */}
        <div 
          className="absolute inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/hero-background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        {/* 模糊遮罩 */}
        <div className="absolute inset-0 z-[-1] bg-white/10 backdrop-blur-sm" />
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center w-full">
          {/* 居中内容 */}
          <div className="space-y-12 max-w-3xl">
            {/* 标题和描述 */}
            <h1 className="mx-auto mb-6 mt-8 max-w-3xl text-balance text-7xl font-bold lg:mb-10 lg:text-7xl text-white drop-shadow-lg">
              {locale === 'zh' ? (
                <>
                  <span>用任意食材，</span>
                  <br />
                  <span>生成</span>
                  <span className="text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text drop-shadow-none font-extrabold">AI食谱</span>
                </>
              ) : (
                <>
                  <span className="text-transparent bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 bg-clip-text drop-shadow-none font-extrabold">Free Online AI</span>
                  <span className="text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text drop-shadow-none font-extrabold"> Recipes Generator</span>
                  <br />
                  <span className="text-white"> From Any Ingredients</span>
                </>
              )}
            </h1>
            <p className="m mx-auto max-w-3xl text-white/90 lg:text-xl drop-shadow-md mb-8">
              {t('description')}
            </p>
            {/* 特色信息 Badge */}
            <div className="flex flex-wrap gap-2 items-center justify-center mt-8 mb-8">
              <div className="inline-flex items-center px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium text-white drop-shadow-sm">
                {t('badgeFreeRecipeCreation')}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium text-white drop-shadow-sm">
                {t('badgeRegisterForImages')}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium text-white drop-shadow-sm">
                {t('badgeStartWithCredits')}
              </div>
              <div className="inline-flex items-center px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium text-white drop-shadow-sm">
                {t('badgeImageCostPerCredit')}
              </div>
            </div>
            {/* 按钮组 */}
            <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-full px-8 w-full sm:w-auto"
                onClick={() => {
                  const recipeFormElement = document.getElementById('recipe-form-section');
                  if (recipeFormElement) {
                    const elementTop = recipeFormElement.offsetTop;
                    // 滚动到第一屏完全消失的位置，即recipe-form-section的顶部减去一个小的偏移量
                    window.scrollTo({
                      top: elementTop, // 减去20px确保第一屏完全消失
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <Rocket className="w-4 h-4 mr-2" />
                {t('tryNow')}
              </Button>
              <Button
                size="lg"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-black/40 text-white hover:bg-black/60 h-11 rounded-full px-8 w-full sm:w-auto backdrop-blur-md shadow-lg"
                onClick={() => {
                  // 跳转到导航栏中 Explore 对应的页面
                  router.push(`/${locale}/recipes`);
                }}
              >
                <Compass className="w-4 h-4 mr-2" />
                {locale === 'zh' ? '探索食谱' : 'Explore Recipes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* 第二个div: Recipe Form Section */}
      <div id="recipe-form-section" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-16 pb-16">
        <div className="relative w-full">
          {/* 装饰性背景元素 */}
          <div className="absolute -top-4 -left-4 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-amber-400/15 rounded-full blur-2xl"></div>
          <div className="absolute top-0 left-1/4 w-24 h-24 bg-gradient-to-br from-orange-300/10 to-amber-300/8 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 right-8 w-16 h-16 bg-gradient-to-r from-orange-200/6 to-amber-100/4 rounded-full blur-lg"></div>
          
          {/* 微妙的边框高光 */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent p-px">
            <div className="w-full h-full rounded-3xl bg-transparent"></div>
          </div>
          {/* 内容区域 */}
          <div className="relative z-10">
            <RecipeForm
              formData={formData}
              onFormChange={handleFormChange}
              onSubmit={handleSubmit}
              loading={loading || imageGenerating}
              showRecipe={showRecipe}
              setShowRecipe={setShowRecipe}
              // 新增：tab相关props
              activeTab={activeTab}
              onTabChange={handleTabChange}
              mealPlannerText={mealPlannerText}
              onMealPlannerTextChange={handleMealPlannerTextChange}
              onMealPlannerClear={handleMealPlannerClear}
              onMealPlannerSubmit={handleMealPlannerSubmit}
            />
          </div>

          {/* Recipe Display Section */}
          {showRecipe && activeTab === 'recipe-maker' && (
            <div id="loading-animation-container" className="relative z-10 mt-6">
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
                <div className="max-w-screen-md mx-auto text-center mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
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