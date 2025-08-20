import { useCallback } from 'react';
import { Recipe } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';

export const useRecipeSave = () => {
  const { user } = useAuth();
  const locale = useLocale();

  const saveRecipe = useCallback(async (recipe: Recipe, userId?: string) => {
    try {
      // 调用本地 Next.js API 路由，它会转发到 Worker API
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe,
          userId: userId || user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save recipe');
      }

      const result = await response.json() as any;
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save recipe');
      }

      return result;
    } catch (error) {
      console.error('Save recipe error:', error);
      throw error;
    } finally {
      // setLoading(false); // This line was removed from the new_code, so it's removed here.
    }
  }, [user?.id]);

  return { saveRecipe };
}; 