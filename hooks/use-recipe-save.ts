import { useCallback } from 'react';
import { Recipe } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';

export const useRecipeSave = () => {
  const { user } = useAuth();
  const locale = useLocale();

  const saveRecipe = useCallback(async (recipe: Recipe, imageModel: string) => {
    console.log('Saving recipe to database:', recipe.title);
    
    if (!user?.id) {
      throw new Error('User not logged in');
    }
    
    try {
      // 调用本地 Next.js API 路由，它会转发到 Worker API
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe: {
            ...recipe,
            imageModel: imageModel
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

      return result;
    } catch (error) {
      console.error('Save recipe error:', error);
      toast.error(locale === 'zh' ? '保存菜谱失败' : 'Failed to save recipe');
      throw error;
    }
  }, [user?.id, locale]);

  return { saveRecipe };
}; 