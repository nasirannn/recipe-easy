"use client";
import { GridBackground } from "@/components/ui/grid-background";
import { useState, useEffect } from "react";
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
import { toast } from "sonner";

export const HeroSection = () => {
  const t = useTranslations('hero');
  const locale = useLocale();
  const { user, isAdmin } = useAuth();
  const { credits, updateCreditsLocally } = useUserUsage();
  
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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchedIngredients, setSearchedIngredients] = useState<RecipeFormData['ingredients']>([]);
  const [showRecipe, setShowRecipe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({}); // 为每个菜谱跟踪loading状态

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
          formData.imageModel || 'wanx', // 使用表单中选择的模型，默认为万象
          1, // 生成1张图片
          user?.id, // 传递用户ID
          isAdmin // 传递管理员标识
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

  // 登录成功后生成图片的处理函数
  const handleLoginSuccess = async () => {
    // 如果当前有菜谱但没有图片，开始生成图片
    if (recipes.length > 0 && recipes.some(r => !r.image)) {
      console.log('Login successful, starting image generation...');
      await generateRecipeImages(recipes);
    }
  };

  // 监听登录模态窗口事件
  useEffect(() => {
    const handleShowLoginModal = () => {
      // 这里可以触发登录模态窗口显示
      // 由于登录模态窗口在RecipeForm组件中，我们需要通过其他方式触发
      console.log('Show login modal requested');
    };

    const handleLoginSuccess = () => {
      // 登录成功后生成图片
      setTimeout(() => {
        handleLoginSuccess();
      }, 1000); // 给一点时间让登录状态更新
    };

    const handleGenerateImage = (event: CustomEvent) => {
      console.log('handleGenerateImage triggered', event.detail);
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
        console.log('Insufficient credits:', availableCredits);
        toast.error(locale === 'zh' ? '积分不足，无法生成图片' : 'Insufficient credits to generate image');
        return;
      }

      console.log('Starting image generation for recipe:', recipe.title);
      
      // 设置该菜谱的loading状态
      setImageLoadingStates(prev => ({ ...prev, [recipeId]: true }));
      
      // 已登录用户，生成图片
      generateImageForRecipe(
        { 
          name: recipe.title, 
          description: recipe.description,
          ingredients: recipe.ingredients
        }, 
        'photographic',
        formData.imageModel || 'wanx',
        1,
        user?.id,
        isAdmin
      ).then(imageUrl => {
        console.log('Image generated successfully:', imageUrl);
        if (imageUrl) {
          // 更新对应菜谱的图片
          setRecipes(prevRecipes => 
            prevRecipes.map(r => 
              r.id === recipeId ? { ...r, image: imageUrl } : r
            )
          );
          
          // 扣减积分
          if (!isAdmin) {
            updateCreditsLocally(1);
          }
          
          toast.success(locale === 'zh' ? '图片生成成功！' : 'Image generated successfully!');
        }
      }).catch(error => {
        console.error('Error generating image:', error);
        
        // 处理402错误（积分不足）
        if (error.response?.status === 402) {
          toast.error(locale === 'zh' ? '积分不足，无法生成图片' : 'Insufficient credits to generate image');
        } else {
          toast.error(locale === 'zh' ? '图片生成失败，请重试' : 'Image generation failed, please try again');
        }
      }).finally(() => {
        // 清除该菜谱的loading状态
        setImageLoadingStates(prev => ({ ...prev, [recipeId]: false }));
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
  }, [recipes, user?.id, isAdmin, formData.imageModel, updateCreditsLocally, locale, credits]);

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
        imageModel: "wanx"
      });
    }
  }, [user]);

  // 监听用户状态变化，当用户登录后自动生成图片
  // useEffect(() => {
  //   if (user?.id && recipes.length > 0 && recipes.some(r => !r.image)) {
  //     // 用户已登录且有菜谱但没有图片，开始生成图片
  //     console.log('User logged in, starting image generation...');
  //     generateRecipeImages(recipes);
  //   }
  // }, [user?.id, recipes, generateRecipeImages]);

  // 监听新用户登录，显示积分提醒
  useEffect(() => {
    if (user?.id) {
      // 检查是否是新用户（通过检查用户创建时间或积分记录）
      const checkNewUser = async () => {
        try {
          const response = await fetch(`/api/user-usage?userId=${user.id}&isAdmin=${isAdmin}`);
          const data = await response.json();
          
          if (data.success && data.data?.credits?.total_earned === data.data?.credits?.credits) {
            // 新用户，显示积分提醒
            toast.success(
              t('newUserWelcome', { credits: data.data.credits.credits })
            );
          }
        } catch (error) {
          console.error('Error checking new user:', error);
        }
      };
      
      checkNewUser();
    }
  }, [user?.id, isAdmin, locale, t]);
  
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
      
      // 移除菜谱生成时的积分扣减 - 现在只在生成图片时扣减
      // 立即在本地更新积分（非管理员用户）
      // if (user?.id && !isAdmin) {
      //   updateCreditsLocally(1);
      // }
      
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
                    imageLoadingStates={imageLoadingStates}
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
