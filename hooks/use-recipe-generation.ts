// ==================== 食谱生成 Hook ====================

import { useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { 
  Recipe, 
  RecipeFormData, 
  Ingredient,
  UseRecipeGenerationReturn
} from '@/lib/types';
import { APP_CONFIG } from '@/lib/config';
import { useAuth } from '@/contexts/auth-context';
import { useUserUsage } from './use-user-usage';
import { createAuthRequiredError } from '@/lib/utils/auth-error';

/**
 * 食谱生成相关的自定义Hook
 * 直接调用Next.js API路由，避免代码重复
 */
export function useRecipeGeneration(): UseRecipeGenerationReturn {
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const locale = useLocale();
  const { session } = useAuth();
  const { updateCreditsLocally } = useUserUsage();
  const signInRequiredMessage =
    locale.toLowerCase().startsWith('zh')
      ? '请先登录后再生成菜谱'
      : 'Please sign in to generate recipes';

  /**
   * 生成食谱
   */
  const generateRecipe = useCallback(async (formData: RecipeFormData): Promise<Recipe[]> => {
    if (!session?.access_token) {
      setError(signInRequiredMessage);
      throw createAuthRequiredError(signInRequiredMessage);
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ingredients: formData.ingredients,
          servings: formData.servings,
          cookingTime: formData.cookingTime,
          vibe: formData.vibe,
          mealType: formData.mealType,
          cuisine: formData.cuisine,
          language: locale,
          languageModel: formData.languageModel,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw createAuthRequiredError(signInRequiredMessage);
        }
        const errorData = await response.json() as any;
        throw new Error(errorData.error || '食谱生成失败');
      }

      const data = await response.json() as any;
      // API返回格式: { recipes: [...] }
      const generatedRecipes = data.recipes || [];
      
      setRecipes(generatedRecipes);
      updateCreditsLocally(APP_CONFIG.recipeGenerationCost);
      return generatedRecipes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '食谱生成失败，请稍后重试';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [locale, session?.access_token, signInRequiredMessage, updateCreditsLocally]);

  /**
   * 重新生成食谱
   */
  const regenerateRecipe = useCallback(async (
    ingredients: Ingredient[], 
    originalRecipe: Recipe, 
    formData: RecipeFormData
  ): Promise<Recipe[]> => {
    // 使用新的食材重新生成
    const updatedFormData: RecipeFormData = {
      ...formData,
      ingredients
    };

    return generateRecipe(updatedFormData);
  }, [generateRecipe]);

  /**
   * 清空食谱列表
   */
  const clearRecipes = useCallback(() => {
    setRecipes([]);
    setError(null);
  }, []);

  /**
   * 直接设置食谱（用于更新图片等）
   */
  const setRecipesCallback = useCallback((
    value: React.SetStateAction<Recipe[]>
  ) => {
    setRecipes(value);
  }, []);

  return {
    loading,
    recipes,
    error,
    generateRecipe,
    regenerateRecipe,
    clearRecipes,
    setRecipes: setRecipesCallback
  };
} 
