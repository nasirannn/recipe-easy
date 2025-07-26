#!/usr/bin/env tsx

/**
 * 数据迁移脚本：将 recipes.tsx 中的示例数据导入到本地数据库
 * 
 * 使用方法：
 * 1. 确保已安装依赖：npm install
 * 2. 运行脚本：npx tsx scripts/import-recipes.ts
 */

import { importSampleRecipes } from '../lib/services/recipe-service';
import { initDatabase } from '../lib/database';
import { SCHEMA_SQL } from '../lib/database/schema';

// 从 recipes.tsx 复制的示例数据
const sampleRecipes = [
  {
    id: 1,
    title: "Mapo Tofu",
    image_url: "/recipe-images/mapo-tofu.png",
    description: "A bold Sichuan dish featuring soft tofu, ground pork, and a spicy, numbing chili-bean sauce.",
    tags: ["Chinese", "Spicy", "Sichuan", "Main Dish"],
    cookTime: 20,
    servings: 4,
    difficulty: "Medium",
    ingredients: [
      "500g soft tofu, cut into 1-inch cubes",
      "200g ground pork",
      "2 tbsp Doubanjiang (fermented bean paste)",
      "1 tbsp Sichuan peppercorns, ground",
      "3 cloves garlic, minced",
      "2 stalks green onions, chopped",
      "2 tbsp vegetable oil",
      "1 cup chicken stock",
      "1 tsp sugar",
      "1 tbsp cornstarch mixed with 2 tbsp water"
    ],
    steps: [
      "Bring a pot of water to boil. Add a pinch of salt and gently add the tofu cubes. Simmer for 2 minutes, then drain and set aside.",
      "Heat oil in a wok over medium-high heat. Add ground pork and cook until browned, about 3 minutes.",
      "Add garlic and the white parts of green onions, stir-fry for 30 seconds until fragrant.",
      "Add doubanjiang and ground Sichuan peppercorns, stir-fry for another minute.",
      "Pour in chicken stock and add sugar, bring to a simmer.",
      "Gently add the tofu cubes and cook for 5 minutes, allowing the tofu to absorb the flavors.",
      "Stir in the cornstarch slurry to thicken the sauce.",
      "Garnish with the green parts of green onions and serve hot with steamed rice."
    ],
    chefTips: [
      "For an authentic Sichuan flavor, look for Pixian doubanjiang, which is considered the best variety of fermented bean paste.",
      "If you prefer a milder version, reduce the amount of Sichuan peppercorns and doubanjiang.",
      "Silken tofu is traditional, but medium-firm tofu holds its shape better if you're new to cooking this dish."
    ]
  },
  {
    id: 2,
    title: "Spaghetti Carbonara",
    image_url: "/recipe-images/spaghetti-carbonara.png",
    description: "Italian pasta with creamy egg-based sauce, crispy pancetta, and black pepper—simple and comforting.",
    tags: ["Italian", "Pasta", "Creamy", "Quick"],
    cookTime: 15,
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "200g spaghetti",
      "100g pancetta or guanciale, diced",
      "2 large eggs",
      "50g Pecorino Romano cheese, grated",
      "50g Parmigiano Reggiano, grated",
      "2 cloves garlic, minced (optional)",
      "Freshly ground black pepper",
      "Salt for pasta water"
    ],
    steps: [
      "Bring a large pot of salted water to a boil and cook spaghetti according to package instructions until al dente.",
      "While pasta is cooking, heat a large skillet over medium heat. Add pancetta and cook until crispy, about 5 minutes.",
      "In a bowl, whisk together eggs, grated cheeses, and plenty of black pepper.",
      "Reserve 1/2 cup of pasta water before draining the cooked pasta.",
      "Working quickly, add hot pasta to the skillet with pancetta, remove from heat.",
      "Immediately pour in the egg and cheese mixture, tossing constantly with tongs. The residual heat will cook the eggs into a creamy sauce.",
      "Add a splash of reserved pasta water as needed to achieve a silky consistency.",
      "Serve immediately with extra grated cheese and freshly ground black pepper."
    ],
    chefTips: [
      "Never add cream to authentic carbonara - the creaminess comes from the eggs and cheese alone.",
      "The key to avoiding scrambled eggs is removing the pan from heat before adding the egg mixture.",
      "Guanciale (cured pork jowl) is traditional, but pancetta or even thick-cut bacon can work as substitutes.",
      "Save some pasta water - its starchiness helps create a silky sauce that clings to the pasta."
    ]
  },
  {
    id: 3,
    title: "Ratatouille",
    image_url: "/recipe-images/ratatouille.png",
    description: "Colorful baked medley of zucchini, eggplant, and tomatoes, a French Provençal vegetable classic.",
    tags: ["French", "Vegetarian", "Healthy", "Summer"],
    cookTime: 45,
    servings: 4,
    difficulty: "Medium",
    ingredients: [
      "1 eggplant, sliced",
      "1 zucchini, sliced",
      "1 yellow squash, sliced",
      "1 red bell pepper, sliced",
      "2 tomatoes, sliced",
      "1 onion, finely chopped",
      "2 cloves garlic, minced",
      "400g canned crushed tomatoes",
      "2 tbsp olive oil",
      "1 tsp dried thyme",
      "Salt and black pepper to taste",
      "Fresh basil for garnish"
    ],
    steps: [
      "Preheat oven to 190°C (375°F).",
      "In a skillet, heat 1 tbsp olive oil. Sauté onion and garlic until soft, then add crushed tomatoes, thyme, salt, and pepper. Simmer for 10 minutes.",
      "Spread tomato sauce in the base of a baking dish.",
      "Arrange sliced vegetables (eggplant, zucchini, squash, bell pepper, tomato) in alternating rows over the sauce.",
      "Drizzle remaining olive oil over the vegetables, sprinkle with more thyme and pepper.",
      "Cover with foil and bake for 30 minutes. Uncover and bake an additional 15 minutes until vegetables are tender.",
      "Garnish with fresh basil before serving."
    ],
    chefTips: [
      "Use a mandoline for uniform vegetable slices and faster prep.",
      "Let it rest 10 minutes before serving to enhance flavor.",
      "Great served warm or at room temperature.",
      "Add a pinch of chili flakes for a subtle heat."
    ]
  },
  {
    id: 4,
    title: "Butter Chicken",
    image_url: "/recipe-images/butter-chicken.png",
    description: "Creamy, spiced tomato-based curry with tender chicken, a North Indian favorite served with rice or naan.",
    tags: ["Indian", "Curry", "Creamy", "Spicy"],
    cookTime: 30,
    servings: 4,
    difficulty: "Medium",
    ingredients: [
      "500g boneless chicken thighs, cut into chunks",
      "200g plain yogurt",
      "1 tbsp ginger-garlic paste",
      "1 tsp chili powder",
      "2 tbsp butter",
      "1 onion, chopped",
      "2 cloves garlic, minced",
      "1 tsp garam masala",
      "1 tsp cumin",
      "1/2 tsp turmeric",
      "300g tomato purée",
      "100ml cream",
      "Fresh coriander leaves",
      "Salt to taste"
    ],
    steps: [
      "Marinate chicken in yogurt, chili powder, and ginger-garlic paste for at least 30 minutes.",
      "Heat butter in a pan, sauté onions until golden. Add garlic and spices, cook until fragrant.",
      "Stir in tomato purée, simmer for 10 minutes.",
      "Add marinated chicken, cook until done, about 15 minutes.",
      "Stir in cream, simmer for another 5 minutes.",
      "Garnish with coriander and serve with naan or rice."
    ],
    chefTips: [
      "Marinate overnight for maximum flavor.",
      "Use thighs for juicier, more tender results.",
      "Balance the heat with a pinch of sugar if desired.",
      "Butter adds richness—don't skip it!"
    ]
  },
  {
    id: 5,
    title: "Chicken Teriyaki",
    image_url: "/recipe-images/chicken-teriyaki.png",
    description: "Juicy chicken glazed with a sweet-savory teriyaki sauce, served over steamed rice for a quick Japanese meal.",
    tags: ["Japanese", "Chicken", "Sweet", "Easy"],
    cookTime: 15,
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "2 chicken thighs, boneless and skin-on",
      "2 tbsp soy sauce",
      "2 tbsp mirin",
      "1 tbsp sake",
      "1 tbsp sugar",
      "1 tsp grated ginger",
      "1 tsp oil",
      "Steamed rice for serving",
      "Sesame seeds and chopped scallions for garnish"
    ],
    steps: [
      "Mix soy sauce, mirin, sake, sugar, and ginger in a bowl to make teriyaki sauce.",
      "Heat oil in a pan over medium heat. Place chicken skin-side down and cook until crispy, about 5–6 minutes.",
      "Flip and cook the other side for 3 minutes.",
      "Pour in teriyaki sauce. Simmer and spoon sauce over chicken until glazed and cooked through.",
      "Slice and serve over rice with sesame seeds and scallions."
    ],
    chefTips: [
      "Use skin-on chicken for a crispy texture.",
      "Don't overcrowd the pan—browning is key.",
      "Add a bit of cornstarch to the sauce for a thicker glaze.",
      "Mirin is essential for authentic flavor."
    ]
  },
  {
    id: 6,
    title: "Greek Salad",
    image_url: "/recipe-images/greek-salad.png",
    description: "Refreshing mix of tomatoes, cucumber, olives, and feta cheese, dressed with olive oil and oregano.",
    tags: ["Greek", "Salad", "Vegetarian", "Healthy"],
    cookTime: 15,
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "2 tomatoes, cut into wedges",
      "1 cucumber, sliced",
      "1/2 red onion, thinly sliced",
      "100g feta cheese, cubed",
      "10 Kalamata olives",
      "2 tbsp extra virgin olive oil",
      "1 tsp dried oregano",
      "Salt and black pepper to taste",
      "1 tsp red wine vinegar (optional)"
    ],
    steps: [
      "In a large bowl, combine tomatoes, cucumber, onion, olives, and feta.",
      "Drizzle with olive oil and vinegar if using.",
      "Sprinkle oregano, salt, and pepper. Toss gently.",
      "Serve immediately or chill for 10 minutes."
    ],
    chefTips: [
      "Use good quality olive oil—it makes a difference.",
      "Don't crumble feta—chunks are traditional.",
      "Red onion can be soaked in cold water to mellow flavor.",
      "Serve with crusty bread for a light meal."
    ]
  },
  {
    id: 7,
    title: "Pad Thai",
    image_url: "/recipe-images/pad-thai.png",
    description: "Sweet, sour, and savory stir-fried rice noodles with shrimp, tofu, peanuts, and fresh lime.",
    tags: ["Thai", "Noodles", "Street Food"],
    cookTime: 15,
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "150g rice noodles",
      "100g shrimp, peeled and deveined",
      "50g firm tofu, cubed",
      "2 tbsp tamarind paste",
      "1 tbsp fish sauce",
      "1 tbsp palm sugar or brown sugar",
      "2 cloves garlic, minced",
      "1 egg",
      "2 tbsp vegetable oil",
      "1/4 cup bean sprouts",
      "2 tbsp crushed peanuts",
      "Chopped scallions",
      "Lime wedges"
    ],
    steps: [
      "Soak rice noodles in warm water for 20 minutes or until pliable.",
      "Mix tamarind paste, fish sauce, and sugar in a bowl.",
      "Heat oil in a wok, sauté garlic. Add tofu and shrimp, stir-fry until shrimp is pink.",
      "Push to the side, crack in egg and scramble.",
      "Add noodles and sauce, stir-fry until everything is coated and heated through.",
      "Toss in bean sprouts and scallions.",
      "Serve with crushed peanuts and lime wedges."
    ],
    chefTips: [
      "Don't over-soak noodles—they'll get mushy.",
      "Palm sugar gives authentic sweetness, but brown sugar works too.",
      "Adjust tamarind to taste for more tang.",
      "Stir-fry quickly on high heat for best texture."
    ]
  },
  {
    id: 8,
    title: "Tacos al Pastor",
    image_url: "/recipe-images/tacos-al-pastor.png",
    description: "Mexican tacos filled with marinated pork, grilled pineapple, onions, and cilantro on warm tortillas.",
    tags: ["Mexican", "Street Food", "Pork"],
    cookTime: 30,
    servings: 4,
    difficulty: "Medium",
    ingredients: [
      "500g pork shoulder, thinly sliced",
      "2 dried guajillo chiles",
      "2 garlic cloves",
      "1/2 cup pineapple juice",
      "1 tbsp vinegar",
      "1 tsp oregano",
      "1/2 tsp cumin",
      "Salt and pepper to taste",
      "1 cup pineapple, diced and grilled",
      "1/2 onion, chopped",
      "Fresh cilantro, chopped",
      "8 small corn tortillas",
      "Lime wedges for serving"
    ],
    steps: [
      "Soak chiles in hot water for 10 minutes, then blend with garlic, pineapple juice, vinegar, oregano, cumin, salt, and pepper to make marinade.",
      "Marinate pork in mixture for at least 2 hours, preferably overnight.",
      "Grill or pan-cook pork until slightly charred and cooked through.",
      "Warm tortillas. Top with pork, grilled pineapple, onion, and cilantro.",
      "Serve with lime wedges."
    ],
    chefTips: [
      "Freeze pork slightly for easier slicing.",
      "Marinate overnight for deeper flavor.",
      "Char the pineapple for a smoky sweetness.",
      "Serve on doubled tortillas to prevent tearing."
    ]
  }
];

// 模拟 D1 数据库接口（用于本地开发）
class MockD1Database {
  private data: Map<string, any[]> = new Map();

  prepare(query: string) {
    return {
      bind: (...values: any[]) => ({
        first: async () => {
          // 模拟查询逻辑
          console.log('Mock query:', query, 'with values:', values);
          return null;
        },
        all: async () => {
          console.log('Mock query:', query, 'with values:', values);
          return { results: [] };
        },
        run: async () => {
          console.log('Mock query:', query, 'with values:', values);
          return { success: true };
        }
      })
    };
  }

  async exec(query: string) {
    console.log('Mock exec:', query);
    return { count: 0, duration: 0 };
  }
}

async function main() {
  console.log('🚀 开始导入食谱数据...');
  
  try {
    // 创建模拟数据库实例（在实际环境中，这里应该是真实的 D1 数据库连接）
    const db = new MockD1Database();
    
    // 初始化数据库表结构
    console.log('📋 初始化数据库表结构...');
    await initDatabase(db as any, SCHEMA_SQL);
    
    // 导入示例数据
    console.log('📥 开始导入食谱数据...');
    const result = await importSampleRecipes(db as any, sampleRecipes);
    
    // 输出结果
    console.log('\n✅ 导入完成！');
    console.log(`成功导入: ${result.imported} 个食谱`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ 导入过程中出现的错误:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.success) {
      console.log('\n🎉 所有数据导入成功！');
    } else {
      console.log('\n⚠️  部分数据导入失败，请检查错误信息。');
    }
    
  } catch (error) {
    console.error('❌ 导入过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}
