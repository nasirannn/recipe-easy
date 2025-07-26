import { NextRequest, NextResponse } from 'next/server';

// 食材类型定义
interface Ingredient {
  id: number;
  slug: string;
  name: string;
  category: {
    id: number;
    slug: string;
    name: string;
  };
  is_custom: boolean;
  user_id?: string;
}

interface IngredientCategory {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en'; // 默认英文
    const category = searchParams.get('category'); // 可选的分类过滤
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 尝试从 Cloudflare Workers API 获取数据
    try {
      const workerUrl = new URL('https://recipe-easy.annnb016.workers.dev/api/ingredients');
      workerUrl.searchParams.set('lang', language);
      workerUrl.searchParams.set('limit', limit.toString());
      workerUrl.searchParams.set('offset', offset.toString());
      if (category) workerUrl.searchParams.set('category', category);

      const response = await fetch(workerUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // 禁用缓存
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return NextResponse.json(data);
        }
      }
      
      console.log('Workers API failed, falling back to static data');
    } catch (workerError) {
      console.error('Workers API error, falling back to static data:', workerError);
    }

    // 备用：使用静态数据（从 ingredients.ts 导入的简化版本）
    const staticIngredients: Ingredient[] = [
      {
        id: 1,
        slug: 'apple',
        name: language === 'zh' ? '苹果' : 'Apple',
        category: {
          id: 4,
          slug: 'fruits',
          name: language === 'zh' ? '水果' : 'Fruits'
        },
        is_custom: false
      },
      {
        id: 2,
        slug: 'chicken_breast',
        name: language === 'zh' ? '鸡胸' : 'Chicken Breast',
        category: {
          id: 1,
          slug: 'meat',
          name: language === 'zh' ? '肉类' : 'Meat'
        },
        is_custom: false
      },
      {
        id: 3,
        slug: 'tomato',
        name: language === 'zh' ? '番茄' : 'Tomato',
        category: {
          id: 3,
          slug: 'vegetables',
          name: language === 'zh' ? '蔬菜' : 'Vegetables'
        },
        is_custom: false
      }
    ];

    // 应用分类过滤
    let filteredIngredients = staticIngredients;
    if (category) {
      filteredIngredients = staticIngredients.filter(ingredient => 
        ingredient.category.slug === category
      );
    }

    // 应用分页
    const paginatedIngredients = filteredIngredients.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedIngredients,
      total: filteredIngredients.length,
      limit,
      offset,
      language,
      source: 'static'
    });

  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ingredients',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 获取食材分类的 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, language = 'en' } = body;

    if (action === 'getCategories') {
      // 尝试从 Workers API 获取分类数据
      try {
        const workerUrl = `https://recipe-easy.annnb016.workers.dev/api/ingredients/categories?lang=${language}`;
        
        const response = await fetch(workerUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            return NextResponse.json(data);
          }
        }
      } catch (workerError) {
        console.error('Workers API error for categories:', workerError);
      }

      // 备用静态分类数据
      const staticCategories: IngredientCategory[] = [
        { id: 1, slug: 'meat', name: language === 'zh' ? '肉类' : 'Meat', sort_order: 1 },
        { id: 2, slug: 'seafood', name: language === 'zh' ? '海鲜' : 'Seafood', sort_order: 2 },
        { id: 3, slug: 'vegetables', name: language === 'zh' ? '蔬菜' : 'Vegetables', sort_order: 3 },
        { id: 4, slug: 'fruits', name: language === 'zh' ? '水果' : 'Fruits', sort_order: 4 },
        { id: 5, slug: 'dairy-eggs', name: language === 'zh' ? '乳制品和蛋类' : 'Dairy & Eggs', sort_order: 5 },
        { id: 6, slug: 'grains-bread', name: language === 'zh' ? '谷物和面包' : 'Grains & Bread', sort_order: 6 },
        { id: 7, slug: 'nuts-seeds', name: language === 'zh' ? '坚果和种子' : 'Nuts & Seeds', sort_order: 7 },
        { id: 8, slug: 'herbs-spices', name: language === 'zh' ? '香草和香料' : 'Herbs & Spices', sort_order: 8 },
        { id: 9, slug: 'oils-condiments', name: language === 'zh' ? '油类和调料' : 'Oils & Condiments', sort_order: 9 }
      ];

      return NextResponse.json({
        success: true,
        data: staticCategories,
        total: staticCategories.length,
        language,
        source: 'static'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in POST /api/ingredients:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
