import { useState, useCallback } from 'react';
import { Recipe } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useUserUsage } from '@/hooks/use-user-usage';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';

export const useImageGeneration = () => {
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const { user, isAdmin } = useAuth();
  const { credits, updateCreditsLocally } = useUserUsage();
  const locale = useLocale();

  const generateImage = useCallback(async (
    recipeId: string, 
    recipe: Recipe, 
    imageModel: string,
    onSuccess?: (imageUrl: string) => void
  ) => {
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
          ? '积分不足，无法生成图片' 
          : 'Insufficient credits to generate image'
      );
      return;
    }
    
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
          model: imageModel,
          userId: user.id,
          isAdmin: isAdmin,
          language: locale
        }),
      });

      const result = await response.json();
      
      if (result.success && result.imageUrl) {
        // 直接使用后端返回的图片URL（已经上传到R2）
        onSuccess?.(result.imageUrl);
        
        // 积分已在后端扣除，只需要更新本地状态
        if (!isAdmin && updateCreditsLocally) {
          updateCreditsLocally(-1);
        }
        
        toast.success(locale === 'zh' ? '图片生成成功' : 'Image generated successfully');
      } else {
        toast.error(result.error || (locale === 'zh' ? '图片生成失败' : 'Image generation failed'));
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(locale === 'zh' ? '图片生成失败' : 'Image generation failed');
    } finally {
      // 清除该菜谱的loading状态
      setImageLoadingStates(prev => ({ ...prev, [recipeId]: false }));
    }
  }, [user?.id, credits?.credits, isAdmin, updateCreditsLocally, locale]);

  const regenerateImage = useCallback(async (
    recipeId: string, 
    recipe: Recipe, 
    imageModel: string,
    onSuccess?: (imageUrl: string) => void
  ) => {
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
          model: imageModel,
          userId: user.id,
          isAdmin: isAdmin,
          language: locale
        }),
      });

      const result = await response.json();
      
      if (result.success && result.imageUrl) {
        // 直接使用后端返回的图片URL（已经上传到R2）
        onSuccess?.(result.imageUrl);
        
        // 更新积分
        if (!isAdmin && updateCreditsLocally) {
          updateCreditsLocally(-1);
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
  }, [user?.id, credits?.credits, isAdmin, updateCreditsLocally, locale]);

  const clearImageLoadingStates = useCallback(() => {
    setImageLoadingStates({});
  }, []);

  return {
    imageGenerating,
    imageLoadingStates,
    generateImage,
    regenerateImage,
    clearImageLoadingStates
  };
}; 