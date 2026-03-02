import type { MealType } from '@/lib/meal-type';
import type { RecipeVibe } from '@/lib/vibe';

export type HomeRecipePreview = {
  id: string;
  title: string;
  description: string;
  cookingTime: number;
  servings: number;
  vibe: RecipeVibe;
  mealType?: MealType | null;
  userId?: string;
  authorName?: string;
  imagePath?: string;
  createdAt?: string;
  cuisine?: {
    id: number;
    name: string;
    slug?: string;
  };
};
