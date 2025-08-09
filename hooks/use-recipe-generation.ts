// ==================== 食谱生成 Hook ====================

import { useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { 
  Recipe, 
  RecipeFormData, 
  Ingredient,
  UseRecipeGenerationReturn
} from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';

/**
 * 食谱生成相关的自定义Hook
 * 直接调用Next.js API路由，避免代码重复
 */
export function useRecipeGeneration(): UseRecipeGenerationReturn {
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const locale = useLocale();
  const { user, isAdmin } = useAuth();

  /**
   * 生成食谱
   */
  const generateRecipe = useCallback(async (formData: RecipeFormData): Promise<Recipe[]> => {
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
          cookingTime: formData.cookingTime,
          difficulty: formData.difficulty,
          cuisine: formData.cuisine,
          language: locale,
          languageModel: formData.languageModel,
          userId: user?.id,
          isAdmin: isAdmin
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '食谱生成失败');
      }

      const data = await response.json();
      // API返回格式: { recipes: [...] }
      const generatedRecipes = data.recipes || [];
      
      setRecipes(generatedRecipes);
      return generatedRecipes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '食谱生成失败，请稍后重试';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [locale, user?.id, isAdmin]);

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