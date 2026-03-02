import { HomeRecipePreview } from '@/lib/home-types';
import { getPostgresPool } from '@/lib/server/postgres';
import { listRecipes } from '@/lib/server/recipes';

type RecipePreviewOptions = {
  page?: number;
  limit?: number;
  withImage?: boolean;
  search?: string;
  userId?: string;
};

type RecipePreviewResult = {
  recipes: HomeRecipePreview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getRecipePreviews(
  locale: string,
  options: RecipePreviewOptions = {}
): Promise<RecipePreviewResult> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 12;

  try {
    const db = getPostgresPool();
    const result = await listRecipes(db, {
      page,
      limit,
      lang: locale,
      withImage: Boolean(options.withImage),
      search: options.search ?? '',
      userId: options.userId,
    });

    return {
      recipes: result.results.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        cookingTime: recipe.cookingTime,
        servings: recipe.servings,
        vibe: recipe.vibe,
        mealType: recipe.mealType ?? null,
        userId: recipe.userId,
        authorName: recipe.authorName,
        imagePath: recipe.imagePath,
        createdAt: recipe.createdAt,
        cuisine: recipe.cuisine,
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  } catch (error) {
    console.error('Failed to load recipe previews:', error);
    return {
      recipes: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

export async function getHomeRecipePreviews(
  locale: string,
  limit = 9
): Promise<HomeRecipePreview[]> {
  const { recipes } = await getRecipePreviews(locale, {
    page: 1,
    limit,
    withImage: true,
  });
  return recipes;
}
