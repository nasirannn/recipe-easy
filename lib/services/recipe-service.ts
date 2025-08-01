export interface Recipe {
  id: number;
  title: string;
  image_url: string;
  description: string;
  tags: string[];
  cookTime: number;
  servings: number;
  difficulty: string;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  chefTips: string[];
  cuisine?: {
    id: number;
    name: string;
  };
  user_id?: string;
}

// 静态菜谱数据
const staticRecipes: Recipe[] = [
  {
    id: 1,
    title: '番茄炒蛋',
    image_url: '/images/tomato-egg.jpg',
    description: '家常美味的番茄炒蛋',
    tags: ['easy', 'quick', 'chinese'],
    cookTime: 15,
    servings: 2,
    difficulty: 'easy',
    ingredients: ['番茄 2个', '鸡蛋 3个', '盐 适量'],
    seasoning: ['糖 1茶匙'],
    instructions: [
      '番茄切块，鸡蛋打散',
      '锅中放油，倒入鸡蛋炒散',
      '放入番茄翻炒，加入调味料',
      '炒至番茄软烂即可出锅'
    ],
    chefTips: ['番茄不要炒太久，保持一定的形状更好'],
    cuisine: {
      id: 1,
      name: '中餐'
    },
    user_id: 'user1'
  },
  {
    id: 2,
    title: '意大利面',
    image_url: '/images/pasta.jpg',
    description: '简单美味的意大利面',
    tags: ['pasta', 'italian', 'dinner'],
    cookTime: 20,
    servings: 2,
    difficulty: 'easy',
    ingredients: ['意大利面 200克', '番茄酱 100克', '洋葱 1/2个'],
    seasoning: ['盐 适量', '黑胡椒 适量'],
    instructions: [
      '煮意大利面至硬芯',
      '煎炒洋葱和大蒜',
      '加入番茄酱煮沸',
      '与意大利面拌匀'
    ],
    chefTips: ['意大利面不要煮太软'],
    cuisine: {
      id: 2,
      name: '意大利菜'
    },
    user_id: 'user2'
  },
  {
    id: 3,
    title: '宫保鸡丁',
    image_url: '/images/kung-pao-chicken.jpg',
    description: '经典川菜，香辣可口',
    tags: ['spicy', 'chinese', 'chicken'],
    cookTime: 25,
    servings: 3,
    difficulty: 'medium',
    ingredients: ['鸡胸肉 300克', '花生 50克', '干辣椒 8个', '花椒 1茶匙', '葱姜蒜 适量'],
    seasoning: ['酱油 2汤匙', '醋 1汤匙', '料酒 1汤匙', '糖 1茶匙'],
    instructions: [
      '鸡肉切丁并用淀粉腌制',
      '热锅冷油，放入花椒和干辣椒爆香',
      '加入鸡肉翻炒至变色',
      '加入调味料和花生继续翻炒',
      '最后加入葱花即可出锅'
    ],
    chefTips: ['鸡肉不要炒太久，以免变柴', '可以根据个人口味调整辣椒的量'],
    cuisine: {
      id: 1,
      name: '中餐'
    },
    user_id: 'user1'
  }
];

export class RecipeService {
  async getRecipes({
    limit = 10,
    offset = 0,
    tag = null,
    difficulty = null,
    language = 'en'
  }: {
    limit?: number;
    offset?: number;
    tag?: string | null;
    difficulty?: string | null;
    language?: string;
  }) {
    try {
  

      // 过滤菜谱
      let filteredRecipes = [...staticRecipes];
      
      // 按标签过滤
      if (tag) {
        filteredRecipes = filteredRecipes.filter(recipe => 
          recipe.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
        );
      }
      
      // 按难度过滤
      if (difficulty) {
        filteredRecipes = filteredRecipes.filter(recipe => 
          recipe.difficulty === difficulty
        );
      }
      
      // 获取总记录数
      const total = filteredRecipes.length;
      
      // 应用分页
      const paginatedRecipes = filteredRecipes.slice(offset, offset + limit);

      return {
        success: true,
        data: paginatedRecipes,
        total,
        limit,
        offset,
        language,
        source: 'static'
      };
    } catch (error) {
      console.error('❌ 获取菜谱数据失败:', error);
      throw error;
    }
  }

  async getRecipeById(id: string | number, language: string = 'en') {
    try {
      

      // 查找菜谱
      const recipe = staticRecipes.find(recipe => recipe.id === Number(id));
      
      if (!recipe) {
        
        return {
          success: false,
          error: '菜谱不存在',
          source: 'static'
        };
      }

      return {
        success: true,
        data: recipe,
        source: 'static'
      };
    } catch (error) {
      console.error(`❌ 获取菜谱详情失败，ID: ${id}:`, error);
      throw error;
    }
  }
}
