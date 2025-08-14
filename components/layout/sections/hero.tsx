"use client";
import { GridBackground } from "@/components/ui/grid-background";
import { Button } from "@/components/ui/button";
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import React, { useState, useEffect, useCallback } from "react";
import { Rocket } from "lucide-react";
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
  const tRecipe = useTranslations('recipeDisplay');
  const locale = useLocale();
  const { user, isAdmin } = useAuth();
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
    generateImage, 
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
      console.error('Regenerate recipe error:', error);
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
      console.error('Regenerate image error:', error);
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
      console.error('Recipe generation failed:', error);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      await saveRecipe(recipe, formData.imageModel);
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  return (
    <section id="hero" className="w-full bg-primary/5">
      {/* 第一个div: Hero Intro Section */}
      <div className="w-full pb-8 lg:pb-0">
        <GridBackground className="absolute inset-0 z-[-1] opacity-50" />
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
          {/* 左侧内容 */}
          <div className="text-center lg:text-left space-y-8 flex-1 max-w-2xl lg:max-w-none pt-20">
            {/* 标题和描述 */}
            <h1 className="text-5xl md:text-7xl font-bold">
              {locale === 'zh' ? (
                <>
                  <span>万能食材</span>
                  <br />
                  <span className="text-transparent bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">AI食谱生成器</span>
                </>
              ) : (
                <>
                  <span className="text-transparent bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">AI recipes generator</span>
                  <span> from any ingredients</span>
                </>
              )}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl lg:max-w-none leading-relaxed">
              {locale === 'zh' ? (
                <>
                  只需选择或输入现有食材，AI 即刻为您生成随机搭配、
                  <br />
                  创意十足、简单易做的食谱。从此告别"今晚吃什么？"的烦恼。
                </>
              ) : (
                <>
                  {t('description').split('. ').map((sentence, index, array) => (
                    <React.Fragment key={index}>
                      {sentence}
                      {index < array.length - 1 ? '. ' : ''}
                      {index < array.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl lg:max-w-none leading-relaxed">
              {t('benefitsBadge')}
            </p>
            {/* 按钮组 */}
            <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start mt-12">
              <Button
                size="lg"
                className="rounded-full px-6"
                onClick={() => {
                  const recipeFormElement = document.getElementById('recipe-form-section');
                  if (recipeFormElement) {
                    const elementRect = recipeFormElement.getBoundingClientRect();
                    const absoluteElementTop = elementRect.top + window.pageYOffset;

                    window.scrollTo({
                      top: absoluteElementTop - 100, // 留一些顶部空间
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <Rocket className="w-4 h-4 mr-2" />
                {t('tryNow')}
              </Button>
            </div>
          </div>
          {/* 右侧视频区域 */}
          <div className="flex-shrink-0 w-full lg:w-[500px]" style={{ position: 'relative', paddingBottom: 'calc(52.31292517006803% + 41px)', height: 0 }}>
            <iframe
              src="https://demo.arcade.software/S6h2tXiDTTN888NDMfSG?embed&embed_mobile=inline&embed_desktop=inline&show_copy_link=true"
              title=""
              frameBorder="0"
              loading="lazy"
              allowFullScreen
              allow="clipboard-write"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', colorScheme: 'light' }}
            />
          </div>
        </div>
      </div>
      {/* 第二个div: Recipe Form Section */}
      <div id="recipe-form-section" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 pb-8">
        <div className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-12">
          <RecipeForm
            formData={formData}
            onFormChange={handleFormChange}
            onSubmit={handleSubmit}
            loading={loading || imageGenerating}
            showRecipe={showRecipe}
            setShowRecipe={setShowRecipe}
          />
          {/* Recipe Display Section */}
          {showRecipe && (
            <div id="loading-animation-container" className="mt-6">
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