// ==================== 图片生成 Hook ====================

import { useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { 
  Recipe, 
  ImageModel,
  UseImageGenerationReturn
} from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useUserUsage } from './use-user-usage';

/**
 * 图片生成相关的自定义Hook
 * 直接调用Next.js API路由，避免代码重复
 */
export function useImageGeneration(): UseImageGenerationReturn {
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  
  const locale = useLocale();
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin';
  const { updateCreditsLocally } = useUserUsage();

  /**
   * 设置单个食谱的图片加载状态
   */
  const setImageLoadingState = useCallback((recipeId: string, loading: boolean) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [recipeId]: loading
    }));
  }, []);

  /**
   * 生成图片的通用方法
   */
  const generateImageInternal = useCallback(async (
    recipeId: string,
    recipe: Recipe,
    imageModel: ImageModel,
    onSuccess: (imageUrl: string) => void
  ): Promise<void> => {
    if (!user?.id) {
      throw new Error('请先登录以生成图片');
    }

    try {
      // 设置加载状态
      setImageLoadingState(recipeId, true);
      setImageGenerating(true);

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeTitle: recipe.title,
          recipeDescription: recipe.description,
          recipeIngredients: recipe.ingredients,
          userId: user.id,
          isAdmin: isAdmin,
          language: locale
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || '图片生成失败');
      }

      const data = await response.json() as { success?: boolean; imageUrl?: string; error?: string };
      
      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || '图片生成失败');
      }

      // 图片生成成功，立即更新前端积分状态（仅非管理员用户）
      if (!isAdmin) {
        updateCreditsLocally(1);
      }

      // 调用成功回调
      onSuccess(data.imageUrl);
    } catch (error) {
      // Image generation failed
      throw error;
    } finally {
      setImageLoadingState(recipeId, false);
      setImageGenerating(false);
    }
  }, [locale, user?.id, isAdmin, setImageLoadingState, updateCreditsLocally]);

  /**
   * 生成食谱图片
   */
  const generateImage = useCallback(async (
    recipeId: string,
    recipe: Recipe,
    imageModel: ImageModel,
    onSuccess: (imageUrl: string) => void
  ): Promise<void> => {
    try {
      await generateImageInternal(recipeId, recipe, imageModel, onSuccess);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '图片生成失败，请稍后重试';
      // Generate image error
      throw error;
    }
  }, [generateImageInternal]);

  /**
   * 重新生成食谱图片
   */
  const regenerateImage = useCallback(async (
    recipeId: string,
    recipe: Recipe,
    imageModel: ImageModel,
    onSuccess: (imageUrl: string) => void
  ): Promise<void> => {
    try {
      await generateImageInternal(recipeId, recipe, imageModel, onSuccess);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '图片生成失败，请稍后重试';
      // Regenerate image error
      throw error;
    }
  }, [generateImageInternal]);

  /**
   * 清空图片加载状态
   */
  const clearImageLoadingStates = useCallback(() => {
    setImageLoadingStates({});
    setImageGenerating(false);
  }, []);

  /**
   * 批量生成图片
   */
  const generateImagesForRecipes = useCallback(async (
    recipes: Recipe[],
    imageModel: ImageModel,
    onRecipeImageGenerated: (recipeId: string, imageUrl: string) => void
  ): Promise<void> => {
    if (!user?.id) {
      throw new Error('请先登录以生成图片');
    }

    try {
      setImageGenerating(true);

      // 并发生成图片（但限制并发数）
      const concurrency = 2; // 限制并发数为2
      const batches: Recipe[][] = [];
      
      for (let i = 0; i < recipes.length; i += concurrency) {
        batches.push(recipes.slice(i, i + concurrency));
      }

      for (const batch of batches) {
        const promises = batch.map(async (recipe) => {
          try {
            setImageLoadingState(recipe.id, true);

            const response = await fetch('/api/generate-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recipeTitle: recipe.title,
                recipeDescription: recipe.description,
                recipeIngredients: recipe.ingredients,
                userId: user.id,
                isAdmin: isAdmin,
                language: locale
              }),
            });

            if (response.ok) {
              const data = await response.json() as { success?: boolean; imageUrl?: string };
              if (data.success && data.imageUrl) {
                onRecipeImageGenerated(recipe.id, data.imageUrl);
              }
            }
          } catch (error) {
            // 单个图片生成失败
            // 单个图片生成失败不影响其他图片
          } finally {
            setImageLoadingState(recipe.id, false);
          }
        });

        await Promise.all(promises);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量图片生成失败，请稍后重试';
      // 批量图片生成错误
      throw error;
    } finally {
      setImageGenerating(false);
    }
  }, [locale, user?.id, isAdmin, setImageLoadingState]);

  return {
    imageGenerating,
    imageLoadingStates,
    generateImage,
    regenerateImage,
    clearImageLoadingStates,
    generateImagesForRecipes
  };
} 