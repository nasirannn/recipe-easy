import { useCallback } from 'react';
import { Recipe } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from 'next-intl';
import { getUserDisplayName } from '@/lib/utils/user-display';
import { createAuthRequiredError } from '@/lib/utils/auth-error';

export const useRecipeSave = () => {
  const { user, session } = useAuth();
  const locale = useLocale();

  const saveRecipes = useCallback(async (recipes: Recipe[], userId?: string) => {
    if (!recipes.length) {
      return {
        success: true,
        recipes: [],
        count: 0,
        alreadyExists: false,
        hasUpdatedImage: false,
      };
    }

    if (!session?.access_token) {
      const signInRequiredMessage = locale.toLowerCase().startsWith('zh')
        ? '请先登录后再保存菜谱'
        : 'Please sign in to save recipes';
      throw createAuthRequiredError(signInRequiredMessage);
    }

    try {
      // 调用本地 Next.js API 路由，由服务端直接写入 Neon
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recipes,
          userId: userId || user?.id,
          authorName: getUserDisplayName(user),
          language: locale, // 传递当前语言
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const signInRequiredMessage = locale.toLowerCase().startsWith('zh')
            ? '请先登录后再保存菜谱'
            : 'Please sign in to save recipes';
          throw createAuthRequiredError(signInRequiredMessage);
        }
        throw new Error('Failed to save recipe');
      }

      const result = await response.json() as any;
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save recipe');
      }

      return result;
    } catch (error) {
      // Save recipe error
      throw error;
    } finally {
      // setLoading(false); // This line was removed from the new_code, so it's removed here.
    }
  }, [locale, session?.access_token, user, user?.id]);

  const saveRecipe = useCallback(async (recipe: Recipe, userId?: string) => {
    return saveRecipes([recipe], userId);
  }, [saveRecipes]);

  return { saveRecipe, saveRecipes };
};
