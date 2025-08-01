"use client";
import { GridBackground } from "@/components/ui/grid-background";
import { useState } from "react";
import { Recipe, RecipeFormData } from "@/lib/types";
import { RecipeForm } from "@/components/ui/recipe-form";
import { RecipeDisplay } from "@/components/ui/recipe-display";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { generateImageForRecipe } from "@/lib/services/image-service";
import { IMAGE_GEN_CONFIG, APP_CONFIG } from "@/lib/config";
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from "@/contexts/auth-context";
import { useUserUsage } from "@/hooks/use-user-usage";
import { Button } from "@/components/ui/button";
import React from "react";
import { trackRecipeGeneration, trackFeatureUsage } from "@/lib/gtag";

export const HeroSection = () => {
  const t = useTranslations('hero');
  const locale = useLocale();
  const { user, isAdmin } = useAuth();
  const { updateCreditsLocally } = useUserUsage();

  //Recipe Form
  const [formData, setFormData] = useState<RecipeFormData>({
    ingredients: [],
    servings: 2,
    recipeCount: APP_CONFIG.DEFAULT_RECIPE_COUNT,
    cookingTime: "medium",
    difficulty: "medium",
    cuisine: "any",
    imageModel: "wanx" // 默认使用万象模型
  });

  const [loading, setLoading] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [searchedIngredients, setSearchedIngredients] = useState<RecipeFormData['ingredients']>([]);

  const handleFormChange = (data: RecipeFormData) => {
    setFormData(data);
  };

  // 为每个菜谱生成图片
  const generateRecipeImages = async (recipes: Recipe[]) => {
    setImageGenerating(true);
    
    try {
      const updatedRecipes = [...recipes];
      
      // 同时开始所有图片生成任务，但处理结果时按照顺序
      const imagePromises = recipes.map((recipe, index) => 
        generateImageForRecipe(
          { 
            name: recipe.title, 
            description: recipe.description,
            ingredients: recipe.ingredients // recipe.ingredients已经是string[]类型
          }, 
          'photographic', // 固定使用真实照片风格
          formData.imageModel || 'wanx' // 使用表单中选择的模型，默认为万象
        ).then(imageUrl => {
          if (imageUrl) {
            updatedRecipes[index] = { ...updatedRecipes[index], image: imageUrl };
            // 实时更新UI
            setRecipes([...updatedRecipes]);
            
            // 每生成一张图片消耗一个积分（非管理员用户）
            if (user?.id && !isAdmin) {
              updateCreditsLocally(1);
            }
          }
          return imageUrl;
        })
      );
      
      // 等待所有图片生成完成
      await Promise.all(imagePromises);
      
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setImageGenerating(false);
    }
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: formData.ingredients,
          servings: formData.servings,
          // 确保生成的菜谱数量与图片生成能力相匹配
          recipeCount: Math.min(formData.recipeCount, IMAGE_GEN_CONFIG.WANX.MAX_IMAGES),
          cookingTime: formData.cookingTime,
          difficulty: formData.difficulty,
          cuisine: formData.cuisine,
          language: locale, // 传递当前用户选择的语言
          imageModel: formData.imageModel, // 传递选择的图片生成模型
          languageModel: formData.languageModel, // 传递选择的语言模型
          userId: user?.id, // 传递用户ID
          isAdmin: isAdmin // 传递管理员标识
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recipes');
      }

      const data = await response.json();
      const generatedRecipes = data.recipes || [];
      setRecipes(generatedRecipes);
      setSearchedIngredients(formData.ingredients);
      
      // 跟踪菜谱生成事件
      trackRecipeGeneration(formData.cuisine, formData.ingredients.length);
      trackFeatureUsage('recipe_generation');
      
      // 立即在本地更新积分（非管理员用户）
      if (user?.id && !isAdmin) {
        updateCreditsLocally(1);
      }
      
      // 在获取菜谱后自动生成图片
      if (generatedRecipes.length > 0) {
        setShowRecipe(true);
        generateRecipeImages(generatedRecipes);
      }

    } catch (error) {
      console.error('Recipe generation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate recipes');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <section id="hero" className="w-full bg-primary/5 pt-20">

    <GridBackground className="absolute inset-0 z-[-1] opacity-50" />
      {/* 上半部分：左侧标题和描述，右侧视频 */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-center gap-8">
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
                recipeFormElement?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('tryNow')} &rarr;
            </Button>
          </div>
          
          {/* 右侧视频 */}
          <div className="w-full lg:w-2/5 aspect-video rounded-lg overflow-hidden shadow-lg">
            <iframe
              className="w-full h-full"
              title="vimeo-player"
              src="https://player.vimeo.com/video/1103051913?h=e71848409d&byline=0&portrait=0&title=0"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              allowFullScreen
            ></iframe>
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
                recipes.length > 0 && (
                  <RecipeDisplay
                    recipes={recipes}
                    selectedIngredients={searchedIngredients}
                  />
                )
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
