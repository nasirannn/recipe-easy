"use client";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Recipe } from "@/lib/types";
import { RecipeForm, RecipeFormData } from "@/components/ui/recipe-form";
import { GridBackground } from "@/components/ui/grid-background";
import { RecipeDisplay } from "@/components/ui/recipe-display";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { generateImageForRecipe } from "@/lib/services/image-service";
import { IMAGE_GEN_CONFIG, APP_CONFIG } from "@/lib/config";

export const HeroSection = () => {
  //Recipe Form
  const [formData, setFormData] = useState<RecipeFormData>({
    ingredients: [],
    servings: 2,
    recipeCount: APP_CONFIG.DEFAULT_RECIPE_COUNT,
    cookingTime: "medium",
    difficulty: "medium",
    cuisine: "any",
    imageModel: "wanx" // 默认使用万象模型
  });

  const [loading, setLoading] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [searchedIngredients, setSearchedIngredients] = useState<RecipeFormData['ingredients']>([]);

  const handleFormChange = (data: RecipeFormData) => {
    setFormData(data);
  };

  // 为每个菜谱生成图片
  const generateRecipeImages = async (recipes: Recipe[]) => {
    setImageGenerating(true);
    
    try {
      const updatedRecipes = [...recipes];
      
      // 同时开始所有图片生成任务，但处理结果时按照顺序
      const imagePromises = recipes.map((recipe, index) => 
        generateImageForRecipe(
          { 
            name: recipe.title, 
            description: recipe.description,
            ingredients: recipe.ingredients // recipe.ingredients已经是string[]类型
          }, 
          'photographic', // 固定使用真实照片风格
          formData.imageModel || 'wanx' // 使用表单中选择的模型，默认为万象
        ).then(imageUrl => {
          if (imageUrl) {
            updatedRecipes[index] = { ...updatedRecipes[index], image: imageUrl };
            // 实时更新UI
            setRecipes([...updatedRecipes]);
          }
          return imageUrl;
        })
      );
      
      // 等待所有图片生成完成
      await Promise.all(imagePromises);
      
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setImageGenerating(false);
    }
  };
  
  const handleSubmit = async () => {
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
          // 确保生成的菜谱数量与图片生成能力相匹配
          recipeCount: Math.min(formData.recipeCount, IMAGE_GEN_CONFIG.WANX.MAX_IMAGES),
          cookingTime: formData.cookingTime,
          difficulty: formData.difficulty,
          cuisine: formData.cuisine,
          imageModel: formData.imageModel, // 传递选择的图片生成模型
          languageModel: formData.languageModel // 传递选择的语言模型
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recipes');
      }

      const data = await response.json();
      const generatedRecipes = data.recipes || [];
      setRecipes(generatedRecipes);
      setSearchedIngredients(formData.ingredients);
      
      // 在获取菜谱后自动生成图片
      if (generatedRecipes.length > 0) {
        setShowRecipe(true);
        generateRecipeImages(generatedRecipes);
      }

    } catch (error) {
      console.error('Recipe generation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate recipes');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const { theme } = useTheme();
  return (
    <section id="hero" className="w-full bg-primary/5">
      <GridBackground className="absolute inset-0 z-[-1]" />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          {/* <Badge variant="outline" className="text-sm py-1 border-grey">
            <span className="mr-2 text-primary">
              <Badge>Free to use</Badge>
            </span>
            <span> Cook smarter, not harder </span>
          </Badge> */}

          <div className="max-w-screen-lg mx-auto text-center text-3xl md:text-6xl font-bold">
            <h1>
              With our AI-powered assistant, you can<span className="text-transparent px-2 bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">generate recipes</span> easily
            </h1>
          </div>

          <p className="max-w-screen-md mx-auto text-xl text-muted-foreground">
          {'No longer have to worry about what to eat for dinner with our random recipe generator! '}
          {/* {`Use our AI-powered recipe generator to turn your ingredients into quick, random meal ideas.`} */}
          </p>

          <div className="space-y-4 md:space-y-0 md:space-x-4">
           {/* Select Ingredients */}
            <RecipeForm
                formData={formData}
                onFormChange={handleFormChange}
                onSubmit={handleSubmit}
                loading={loading || imageGenerating}
                showRecipe={showRecipe}
                setShowRecipe={setShowRecipe}
              />
          </div>
        </div>
        
        {/* Recipe Display Section */}
        {showRecipe && (
          <div id="loading-animation-container">
            {loading ? (
              <LoadingAnimation />
            ) : (
              recipes.length > 0 && (
                <RecipeDisplay
                  recipes={recipes}
                  selectedIngredients={searchedIngredients.map(ing => ing.name)}
                />
              )
            )}
            {error && (
              <div className="max-w-screen-md mx-auto text-center mt-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
