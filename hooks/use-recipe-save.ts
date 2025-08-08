import { Recipe } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { env } from '@/lib/env';

export const useRecipeSave = () => {
  const { user } = useAuth();
  const locale = useLocale();

  const saveRecipe = async (recipe: Recipe, imageModel: string) => {
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
      console.error('Error saving recipe:', error);
      throw error;
    }
  };

  return {
    saveRecipe
  };
}; 