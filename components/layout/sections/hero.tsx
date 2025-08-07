"use client";
import { GridBackground } from "@/components/ui/grid-background";
import { useState, useEffect } from "react";
import { Recipe, RecipeFormData } from "@/lib/types";
import { LanguageModel, ImageModel } from "@/lib/config";
import { RecipeForm } from "@/components/ui/recipe-form";
import { RecipeDisplay } from "@/components/ui/recipe-display";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { IMAGE_GEN_CONFIG, APP_CONFIG, getRecommendedModels } from "@/lib/config";
import { env } from "@/lib/env";
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from "@/contexts/auth-context";
import { useUserUsage } from "@/hooks/use-user-usage";
import { Button } from "@/components/ui/button";
import React from "react";
import { trackRecipeGeneration, trackFeatureUsage } from "@/lib/gtag";
import { toast } from "sonner";

export const HeroSection = () => {
  const t = useTranslations('hero');
  const tRecipe = useTranslations('recipeDisplay');
  const locale = useLocale();
  const { user, isAdmin } = useAuth();
  const { credits, updateCreditsLocally } = useUserUsage();
  
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
  
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchedIngredients, setSearchedIngredients] = useState<RecipeFormData['ingredients']>([]);
  const [showRecipe, setShowRecipe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({}); // 为每个菜谱跟踪loading状态

  // 监听重新生成菜谱事件
  useEffect(() => {
    const handleRegenerateRecipe = async (event: CustomEvent) => {
      const { ingredients, recipe } = event.detail;
      
      // 设置表单数据
      setFormData(prev => ({
        ...prev,
        ingredients: ingredients
      }));
      
      // 重新生成菜谱
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/generate-recipe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ingredients: ingredients,
            servings: recipe.servings || 2,
            recipeCount: 1,
            cookingTime: recipe.cookingTime || "medium",
            difficulty: recipe.difficulty || "medium",
            cuisine: recipe.cuisine || "any",
            language: locale,
            imageModel: formData.imageModel,
            languageModel: formData.languageModel,
            userId: user?.id,
            isAdmin: isAdmin
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to regenerate recipes');
        }

        const data = await response.json();
        const generatedRecipes = data.recipes || [];
        setRecipes(generatedRecipes);
        setSearchedIngredients(ingredients);
        
        // 跟踪菜谱重新生成事件
        trackRecipeGeneration(recipe.cuisine, ingredients.length);
        trackFeatureUsage('recipe_regeneration');
        
        if (generatedRecipes.length > 0) {
          setShowRecipe(true);
        }
      } catch (error) {
        console.error('Regenerate recipe error:', error);
        setError(error instanceof Error ? error.message : 'Failed to regenerate recipe');
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('regenerateRecipe', handleRegenerateRecipe as EventListener);
    
    return () => {
      window.removeEventListener('regenerateRecipe', handleRegenerateRecipe as EventListener);
    };
  }, [locale, user?.id, isAdmin, formData.imageModel, formData.languageModel]);



  const handleFormChange = (data: RecipeFormData) => {
    setFormData(data);
  };

  // 为每个菜谱生成图片
  const generateRecipeImages = async (recipes: Recipe[]) => {
    setImageGenerating(true);
    
    try {
      const updatedRecipes = [...recipes];
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setImageGenerating(false);
    }
  };

  // 保存菜谱到数据库
  const handleSaveRecipe = async (recipe: Recipe) => {
    console.log('Saving recipe to database:', recipe.title);
    
    if (!user?.id) {
      throw new Error('User not logged in');
    }
    
    try {
      // 调用worker API保存菜谱
      const workerUrl = env.WORKER_URL;
      const response = await fetch(`${workerUrl}/api/recipes/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe: {
            ...recipe,
            imageModel: formData.imageModel || recommendedModels.imageModel // 添加图片模型信息
          },
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save recipe');
      }

      const result = await response.json();
      console.log('Recipe saved successfully:', result);
      
      // 根据返回的状态显示不同的提示
      if (result.alreadyExists) {
        if (result.hasUpdatedImage) {
          toast.success(locale === 'zh' ? '菜谱图片已更新！' : 'Recipe image updated successfully!');
        } else {
          toast.info(locale === 'zh' ? '菜谱已存在，无需重复保存' : 'Recipe already exists, no need to save again');
        }
      } else {
        toast.success(locale === 'zh' ? '菜谱保存成功！' : 'Recipe saved successfully!');
      }
      
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }
  };

  // 重新生成单个菜谱的图片
  const handleRegenerateImage = async (recipeId: string, recipe: Recipe) => {
    console.log('Regenerating image for recipe:', recipe.title);
    
    // 检查用户是否登录
    if (!user?.id) {
      const event = new CustomEvent('showLoginModal');
      window.dispatchEvent(event);
      return;
    }
    
    // 检查积分余额
    const availableCredits = credits?.credits || 0;
    if (!isAdmin && availableCredits < 1) {
      toast.error(
        locale === 'zh' 
          ? '积分不足，无法重新生成图片' 
          : 'Insufficient credits to regenerate image'
      );
      return;
    }
    
    // 设置该菜谱的loading状态并清除现有图片
    setImageLoadingStates(prev => ({ ...prev, [recipeId]: true }));
    
    // 清除现有图片路径，让组件显示loading状态
    const updatedRecipes = recipes.map(r => 
      r.id === recipeId 
        ? { ...r, imagePath: undefined }
        : r
    );
    setRecipes(updatedRecipes);
    
    try {
      // 调用图片生成API
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeTitle: recipe.title,
          recipeDescription: recipe.description,
          recipeIngredients: recipe.ingredients,
          style: 'photographic',
          size: '1024x1024',
          n: 1,
          model: formData.imageModel || recommendedModels.imageModel,
          userId: user.id,
          isAdmin: isAdmin,
          language: locale
        }),
      });

      const result = await response.json();
      
      if (result.success && result.imageUrl) {
        
        // 将AI生成的图片上传到R2存储
        try {
          
          // 下载AI生成的图片
          const imageResponse = await fetch(result.imageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`);
          }
          
          const imageBlob = await imageResponse.blob();
          const imageBuffer = await imageBlob.arrayBuffer();
          
          // 生成正确的图片路径：userId/recipeId/imageName
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const path = `${user.id}/${recipeId}/${timestamp}-${randomString}.jpg`;
          
          // 上传到R2存储
          const uploadResponse = await fetch(`${env.WORKER_URL}/api/upload-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path: path,
              imageData: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(imageBuffer)))), // 转换为base64
              contentType: 'image/jpeg',
              userId: user.id,
              recipeId: recipeId,
              imageModel: formData.imageModel || recommendedModels.imageModel
            }),
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image to R2');
          }
          
          const uploadResult = await uploadResponse.json();
          if (uploadResult.success && uploadResult.imageUrl) {
            // 使用R2的URL更新菜谱
            setRecipes(prevRecipes => prevRecipes.map(r => 
              r.id === recipeId 
                ? { ...r, imagePath: uploadResult.imageUrl }
                : r
            ));
          } else {
            throw new Error('Upload response indicates failure');
          }
        } catch (uploadError) {
          console.error('Failed to upload regenerated image to R2:', uploadError);
          
          // 即使上传失败，也使用原始URL（临时方案）
          setRecipes(prevRecipes => prevRecipes.map(r => 
            r.id === recipeId 
              ? { ...r, imagePath: result.imageUrl }
              : r
          ));
        }
        
        // 更新积分
        if (updateCreditsLocally) {
          updateCreditsLocally();
        }
      } else {
        console.error('Image regeneration failed:', result.error);
        toast.error(result.error || (locale === 'zh' ? '图片重新生成失败' : 'Image regeneration failed'));
      }
    } catch (error) {
      console.error('Error regenerating image:', error);
      toast.error(locale === 'zh' ? '图片重新生成失败' : 'Image regeneration failed');
    } finally {
      // 清除该菜谱的loading状态
      setImageLoadingStates(prev => ({ ...prev, [recipeId]: false }));
    }
  };
  // 监听登录模态窗口事件
  useEffect(() => {
    const handleShowLoginModal = () => {
      // 这里可以触发登录模态窗口显示
      // 由于登录模态窗口在RecipeForm组件中，我们需要通过其他方式触发
    };

    const handleLoginSuccess = () => {
      // 登录成功后生成图片
      setTimeout(() => {
        handleLoginSuccess();
      }, 1000); // 给一点时间让登录状态更新
    };

    const handleGenerateImage = async (event: CustomEvent) => {
      const { recipeId, recipe } = event.detail;
      
      // 检查用户是否登录
      if (!user?.id) {
        console.log('User not logged in, showing login modal');
        // 未登录用户，显示登录模态窗口
        const showLoginEvent = new CustomEvent('showLoginModal');
        window.dispatchEvent(showLoginEvent);
        return;
      }

      console.log('User logged in, checking credits...');
      // 检查积分余额
      const availableCredits = credits?.credits || 0;
      if (!isAdmin && availableCredits < 1) {
        toast.error(tRecipe('insufficientCredits'));
        return;
      }

      console.log('Starting image generation for recipe:', recipe.title);
      
      // 设置该菜谱的loading状态
      setImageLoadingStates(prev => ({ ...prev, [recipeId]: true }));
      
      try {
        // 调用图片生成API
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipeTitle: recipe.title,
            recipeDescription: recipe.description,
            recipeIngredients: recipe.ingredients,
            style: 'photographic',
            size: '1024x1024',
            n: 1,
            model: formData.imageModel || recommendedModels.imageModel,
            userId: user.id,
            isAdmin: isAdmin,
            language: locale
          }),
        });

        const result = await response.json();
        
        if (result.success && result.imageUrl) {
          
          // 直接使用后端返回的图片URL（已经上传到R2）
          const updatedRecipes = recipes.map(r => 
            r.id === recipeId 
              ? { ...r, imagePath: result.imageUrl }
              : r
          );
          setRecipes(updatedRecipes);
          
          // 积分已在后端扣除，只需要更新本地状态
          if (!isAdmin) {
            updateCreditsLocally(-1);
          }
          
          toast.success(locale === 'zh' ? '图片生成成功' : 'Image generated successfully');
        } else {
          toast.error(result.error || (locale === 'zh' ? '图片生成失败' : 'Image generation failed'));
        }
      } catch (error) {
        toast.error(locale === 'zh' ? '图片生成失败' : 'Image generation failed');
        // 清除loading状态
        setImageLoadingStates(prev => ({ ...prev, [recipeId]: false }));
      } finally {
        // 清除该菜谱的loading状态
        setImageLoadingStates(prev => ({ ...prev, [recipeId]: false }));
      }
    };

    window.addEventListener('showLoginModal', handleShowLoginModal);
    window.addEventListener('loginSuccess', handleLoginSuccess);
    window.addEventListener('generateImage', handleGenerateImage as EventListener);

    return () => {
      window.removeEventListener('showLoginModal', handleShowLoginModal);
      window.removeEventListener('loginSuccess', handleLoginSuccess);
      window.removeEventListener('generateImage', handleGenerateImage as EventListener);
    };
  }, [recipes, user?.id, isAdmin, formData.imageModel, updateCreditsLocally, locale, credits, recommendedModels.imageModel]);

  // 监听用户状态变化，当用户登出时重置状态
  useEffect(() => {
    if (!user) {
      // 用户登出，重置所有状态到初始值
      setRecipes([]);
      setSearchedIngredients([]);
      setShowRecipe(false);
      setError(null);
      setImageGenerating(false);
      setImageLoadingStates({});
      
      // 重置表单数据到初始状态
      setFormData({
        ingredients: [],
        servings: 2,
        recipeCount: APP_CONFIG.DEFAULT_RECIPE_COUNT,
        cookingTime: "medium",
        difficulty: "medium",
        cuisine: "any",
        imageModel: recommendedModels.imageModel as ImageModel
      });
    }
  }, [user, recommendedModels.imageModel]);

  
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
          recipeCount: 1, // 固定生成1个菜谱
          cookingTime: formData.cookingTime,
          difficulty: formData.difficulty,
          cuisine: formData.cuisine,
          language: locale, // 传递当前用户选择的语言
          imageModel: formData.imageModel, // 传递选择的图片生成模型
          languageModel: formData.languageModel, // 传递选择的语言模型
          userId: user?.id, // 传递用户ID（可选）
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
      
      // 菜谱生成成功，不显示提示信息
      // 用户需要手动保存菜谱
      
      // 在获取菜谱后自动生成图片（仅登录用户）
      if (generatedRecipes.length > 0) {
        setShowRecipe(true);
        // 移除自动生成图片逻辑，改为手动触发
        // 只有登录用户才生成图片
        // if (user?.id) {
        //   generateRecipeImages(generatedRecipes);
        // }
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
          <div className="w-full lg:w-2/5 -ml-4">
            <div style={{ position: 'relative', paddingBottom: 'calc(52.31292517006803% + 41px)', height: 0, width: '100%' }}>
              <iframe
                src="https://demo.arcade.software/JZ1IjhMuHDzejiJKWn2w?embed&embed_mobile=inline&embed_desktop=inline&show_copy_link=true"
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
                recipes.length > 0 && (
                  <RecipeDisplay 
                    recipes={recipes} 
                    selectedIngredients={searchedIngredients}
                    imageLoadingStates={imageLoadingStates}
                    onRegenerateImage={handleRegenerateImage}
                    onSaveRecipe={handleSaveRecipe}
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
