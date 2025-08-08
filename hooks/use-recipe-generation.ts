import { useState, useCallback } from 'react';
import { Recipe, RecipeFormData } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from 'next-intl';
import { trackRecipeGeneration, trackFeatureUsage } from '@/lib/gtag';

export const useRecipeGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  const locale = useLocale();

  const generateRecipe = useCallback(async (formData: RecipeFormData) => {
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
          recipeCount: 1,
          cookingTime: formData.cookingTime,
          difficulty: formData.difficulty,
          cuisine: formData.cuisine,
          language: locale,
          imageModel: formData.imageModel,
          languageModel: formData.languageModel,
          userId: user?.id,
          isAdmin: isAdmin
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recipes');
      }

      const data = await response.json();
      const generatedRecipes = data.recipes || [];
      setRecipes(generatedRecipes);
      
      // 跟踪菜谱生成事件
      trackRecipeGeneration(formData.cuisine || 'any', formData.ingredients.length);
      trackFeatureUsage('recipe_generation');
      
      return generatedRecipes;
    } catch (error) {
      console.error('Recipe generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate recipes';
      setError(errorMessage);
      setRecipes([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [locale, user?.id, isAdmin]);

  const regenerateRecipe = useCallback(async (ingredients: string[], recipe: Recipe, formData: RecipeFormData) => {
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
          cuisine: "any", // Recipe 类型使用 cuisineId，这里使用默认值
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
      
      // 跟踪菜谱重新生成事件
      trackRecipeGeneration(String(recipe.cuisineId) || 'any', ingredients.length);
      trackFeatureUsage('recipe_regeneration');
      
      return generatedRecipes;
    } catch (error) {
      console.error('Regenerate recipe error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate recipe';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [locale, user?.id, isAdmin]);

  const clearRecipes = useCallback(() => {
    setRecipes([]);
    setError(null);
  }, []);

  return {
    loading,
    recipes,
    error,
    generateRecipe,
    regenerateRecipe,
    clearRecipes,
    setRecipes
  };
}; 