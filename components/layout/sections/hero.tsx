"use client";
import { GridBackground } from "@/components/ui/grid-background";
import { useState, useEffect } from "react";
import { Recipe, RecipeFormData } from "@/lib/types";
import { LanguageModel, ImageModel } from "@/lib/config";
import { RecipeForm } from "@/components/ui/recipe-form";
import { RecipeDisplay } from "@/components/ui/recipe-display";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { APP_CONFIG, getRecommendedModels } from "@/lib/config";
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import React from "react";
import { useRecipeGeneration } from "@/hooks/use-recipe-generation";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useRecipeSave } from "@/hooks/use-recipe-save";

export const HeroSection = () => {
  const t = useTranslations('hero');
  const tRecipe = useTranslations('recipeDisplay');
  const locale = useLocale();
  const { user } = useAuth();
  
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
    languageModel: recommendedModels.languageModel.toUpperCase() as LanguageModel, // 根据语言自动选择语言模型
    imageModel: recommendedModels.imageModel.toLowerCase() as ImageModel // 根据语言自动选择图片模型
  });

  // 当语言改变时，自动更新模型选择（对所有用户生效）
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      languageModel: recommendedModels.languageModel.toUpperCase() as LanguageModel,
      imageModel: recommendedModels.imageModel.toLowerCase() as ImageModel
    }));
  }, [locale, recommendedModels.languageModel, recommendedModels.imageModel]);
  
  const [searchedIngredients, setSearchedIngredients] = useState<RecipeFormData['ingredients']>([]);
  const [showRecipe, setShowRecipe] = useState(false);

  // 监听重新生成菜谱事件
  useEffect(() => {
    const handleRegenerateRecipe = async (event: CustomEvent) => {
      const { ingredients, recipe } = event.detail;
      
      // 设置表单数据
      setFormData(prev => ({
        ...prev,
        ingredients: ingredients
      }));
      
      try {
        const generatedRecipes = await regenerateRecipe(ingredients, recipe, formData);
        setSearchedIngredients(ingredients);
        
        if (generatedRecipes.length > 0) {
          setShowRecipe(true);
        }
      } catch (error) {
        console.error('Regenerate recipe error:', error);
      }
    };

    window.addEventListener('regenerateRecipe', handleRegenerateRecipe as EventListener);
    
    return () => {
      window.removeEventListener('regenerateRecipe', handleRegenerateRecipe as EventListener);
    };
  }, [regenerateRecipe, formData, setFormData, setSearchedIngredients, setShowRecipe]);

  const handleFormChange = (data: RecipeFormData) => {
    setFormData(data);
  };

  // 重新生成单个菜谱的图片
  const handleRegenerateImage = async (recipeId: string, recipe: Recipe) => {
    await regenerateImage(recipeId, recipe, formData.imageModel, (imageUrl) => {
      setRecipes(prevRecipes => prevRecipes.map(r => 
        r.id === recipeId 
          ? { ...r, imagePath: imageUrl }
          : r
      ));
    });
  };

  // 监听登录模态窗口事件
  useEffect(() => {
    const handleShowLoginModal = () => {
      // 这里可以触发登录模态窗口显示
      // 由于登录模态窗口在RecipeForm组件中，我们需要通过其他方式触发
    };

    const handleLoginSuccess = () => {
      // 登录成功后的处理逻辑
      // 这里可以添加登录成功后的操作，比如刷新页面或重新加载数据
      console.log('Login successful');
    };

    const handleGenerateImage = async (event: CustomEvent) => {
      const { recipeId, recipe } = event.detail;
      
      await generateImage(recipeId, recipe, formData.imageModel, (imageUrl) => {
        setRecipes(prevRecipes => prevRecipes.map(r => 
          r.id === recipeId 
            ? { ...r, imagePath: imageUrl }
            : r
        ));
      });
    };

    window.addEventListener('showLoginModal', handleShowLoginModal);
    window.addEventListener('loginSuccess', handleLoginSuccess);
    window.addEventListener('generateImage', handleGenerateImage as EventListener);

    return () => {
      window.removeEventListener('showLoginModal', handleShowLoginModal);
      window.removeEventListener('loginSuccess', handleLoginSuccess);
      window.removeEventListener('generateImage', handleGenerateImage as EventListener);
    };
  }, [generateImage, formData.imageModel, setRecipes]);

  // 监听用户状态变化，当用户登出时重置状态
  useEffect(() => {
    if (!user) {
      // 用户登出，重置所有状态到初始值
      clearRecipes();
      clearImageLoadingStates();
      setSearchedIngredients([]);
      setShowRecipe(false);
      
      // 重置表单数据到初始状态
      setFormData({
        ingredients: [],
        servings: 2,
        recipeCount: APP_CONFIG.DEFAULT_RECIPE_COUNT,
        cookingTime: "medium",
        difficulty: "medium",
        cuisine: "any",
        languageModel: recommendedModels.languageModel.toUpperCase() as LanguageModel,
        imageModel: recommendedModels.imageModel as ImageModel
      });
    }
  }, [user, recommendedModels.imageModel, clearRecipes, clearImageLoadingStates, setSearchedIngredients, setShowRecipe, setFormData, recommendedModels.languageModel]);

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
    <section id="hero" className="w-full bg-primary/5 pt-20">
      <GridBackground className="absolute inset-0 z-[-1] opacity-50" />
      {/* 上半部分：左侧标题和描述，右侧视频 */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* 左侧标题和描述 */}
          <div className="w-full lg:w-3/5 space-y-6 text-center lg:text-left">
            <h1 className="text-3xl md:text-5xl font-bold">
              {locale === 'en' ? (
                <>
                  Free Online <span className="text-transparent bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">AI Recipe Generator</span>
                </>
              ) : (
                <>
                  免费在线<span className="text-transparent bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">AI食谱生成器</span>
                </>
              )}
            </h1>
            <p className="text-xl text-muted-foreground max-w-md leading-relaxed mx-auto lg:mx-0">
              {t('description').split('. ').map((sentence, index, array) => (
                <React.Fragment key={index}>
                  {sentence}
                  {index < array.length - 1 ? '. ' : ''}
                  {index < array.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
            <Button 
              size="lg" 
              className="rounded-full px-6 mt-4"
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
              {t('tryNow')} &rarr;
            </Button>
          </div>
          
          {/* 右侧视频 */}
          <div className="w-full lg:w-2/5 lg:-ml-4">
            <div style={{ position: 'relative', paddingBottom: 'calc(52.31292517006803% + 41px)', height: 0, width: '100%' }}>
              <iframe
                src="https://demo.arcade.software/S6h2tXiDTTN888NDMfSG?embed&embed_mobile=inline&embed_desktop=inline&show_copy_link=true"
                title="Welcome to Recipe Easy - AI Recipe Generator"
                frameBorder="0"
                loading="lazy"
                allowFullScreen
                allow="clipboard-write"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', colorScheme: 'light' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 下半部分：食材选择和菜谱生成区域 */}
      <div id="recipe-form-section" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-16">
        <div className="rounded-xl p-6">
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
            <div id="loading-animation-container" className="mt-10">
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
                <div className="max-w-screen-md mx-auto text-center mt-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
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
