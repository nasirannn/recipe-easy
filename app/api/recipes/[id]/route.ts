/**
 * 菜谱详情API路由
 * 
 * 处理单个菜谱的获取、更新和删除
 */

import { NextRequest, NextResponse } from 'next/server';

// 菜谱类型定义 - 与route.ts中保持一致
interface Recipe {
  id: number;
  title: string;
  image_url: string | null;
  description: string | null;
  tags: string | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: string | null;
  ingredients: string;
  seasoning: string | null;
  instructions: string;
  chef_tips: string | null;
  cuisine_id: number | null;
  cuisine_name?: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// 更新菜谱输入类型
interface UpdateRecipeInput {
  title?: string;
  image_url?: string | null;
  description?: string | null;
  tags?: string[];
  cook_time?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  ingredients?: any[] | string;
  seasoning?: any[] | string | null;
  instructions?: any[] | string;
  chef_tips?: string | null;
  cuisine_id?: number | null;
}

// 静态菜谱数据 - 从主路由导入
// 在实际项目中应该有一个共享的数据存储
// 这里为了简单起见直接复制数据
let recipes: Recipe[] = [
  {
    id: 1,
    title: '番茄炒蛋',
    image_url: '/images/tomato-egg.jpg',
    description: '家常美味的番茄炒蛋',
    tags: 'easy,quick,chinese',
    cook_time: 15,
    servings: 2,
    difficulty: 'easy',
    ingredients: JSON.stringify([
      { name: '番茄', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
      { name: '盐', amount: '适量' }
    ]),
    seasoning: JSON.stringify([
      { name: '糖', amount: '1茶匙' }
    ]),
    instructions: JSON.stringify([
      '番茄切块，鸡蛋打散',
      '锅中放油，倒入鸡蛋炒散',
      '放入番茄翻炒，加入调味料',
      '炒至番茄软烂即可出锅'
    ]),
    chef_tips: '番茄不要炒太久，保持一定的形状更好',
    cuisine_id: 1,
    cuisine_name: '中餐',
    user_id: 'user1',
    created_at: '2023-05-01T12:00:00Z',
    updated_at: '2023-05-01T12:00:00Z'
  },
  {
    id: 2,
    title: '意大利面',
    image_url: '/images/pasta.jpg',
    description: '简单美味的意大利面',
    tags: 'pasta,italian,dinner',
    cook_time: 20,
    servings: 2,
    difficulty: 'easy',
    ingredients: JSON.stringify([
      { name: '意大利面', amount: '200克' },
      { name: '番茄酱', amount: '100克' },
      { name: '洋葱', amount: '1/2个' }
    ]),
    seasoning: JSON.stringify([
      { name: '盐', amount: '适量' },
      { name: '黑胡椒', amount: '适量' }
    ]),
    instructions: JSON.stringify([
      '煮意大利面至硬芯',
      '煎炒洋葱和大蒜',
      '加入番茄酱煮沸',
      '与意大利面拌匀'
    ]),
    chef_tips: '意大利面不要煮太软',
    cuisine_id: 2,
    cuisine_name: '意大利菜',
    user_id: 'user2',
    created_at: '2023-05-02T12:00:00Z',
    updated_at: '2023-05-02T12:00:00Z'
  }
];

/**
 * GET /api/recipes/[id]
 * 获取单个菜谱
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 获取ID参数
  const id = parseInt(params?.id || '0');
  if (isNaN(id) || id <= 0) {
    return NextResponse.json({ error: '无效的ID' }, { status: 400 });
  }
  
  // 查找菜谱
  const recipe = recipes.find(r => r.id === id);
  
  if (!recipe) {
    return NextResponse.json({ error: '菜谱不存在' }, { status: 404 });
  }
  
  return NextResponse.json(recipe);
}

/**
 * PUT /api/recipes/[id]
 * 更新菜谱
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 验证用户认证
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: '需要授权' }, { status: 401 });
  }
  
  // 获取ID参数
  const id = parseInt(params?.id || '0');
  if (isNaN(id) || id <= 0) {
    return NextResponse.json({ error: '无效的ID' }, { status: 400 });
  }
  
  // 验证请求体
  let body: UpdateRecipeInput;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 });
  }
  
  // 查找当前菜谱
  const recipeIndex = recipes.findIndex(r => r.id === id);
  
  if (recipeIndex === -1) {
    return NextResponse.json({ error: '菜谱不存在' }, { status: 404 });
  }
  
  const currentRecipe = recipes[recipeIndex];
  
  // 模拟权限检查
  const userId = 'user1'; // 假设当前用户ID
  const isAdmin = false;  // 假设不是管理员
  if (currentRecipe.user_id !== userId && !isAdmin) {
    return NextResponse.json({ error: '无权更新此菜谱' }, { status: 403 });
  }
  
  // 处理更新字段
  const updates: Record<string, any> = {};
  
  // 处理特殊字段
  if (body.title) updates.title = body.title;
  if (body.image_url !== undefined) updates.image_url = body.image_url;
  if (body.description !== undefined) updates.description = body.description;
  if (body.cook_time !== undefined) updates.cook_time = body.cook_time;
  if (body.servings !== undefined) updates.servings = body.servings;
  if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
  if (body.chef_tips !== undefined) updates.chef_tips = body.chef_tips;
  if (body.cuisine_id !== undefined) updates.cuisine_id = body.cuisine_id;
  
  if (body.tags) {
    updates.tags = body.tags.join(',');
  }
  
  if (body.ingredients) {
    updates.ingredients = Array.isArray(body.ingredients) 
      ? JSON.stringify(body.ingredients)
      : body.ingredients;
  }
  
  if (body.seasoning !== undefined) {
    updates.seasoning = Array.isArray(body.seasoning)
      ? JSON.stringify(body.seasoning)
      : body.seasoning;
  }
  
  if (body.instructions) {
    updates.instructions = Array.isArray(body.instructions)
      ? JSON.stringify(body.instructions)
      : body.instructions;
  }
  
  // 更新菜谱
  const updatedRecipe: Recipe = {
    ...currentRecipe,
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  // 更新数组
  recipes[recipeIndex] = updatedRecipe;
  
  return NextResponse.json(updatedRecipe);
}

/**
 * DELETE /api/recipes/[id]
 * 删除菜谱
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 验证用户认证
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: '需要授权' }, { status: 401 });
  }
  
  // 获取ID参数
  const id = parseInt(params?.id || '0');
  if (isNaN(id) || id <= 0) {
    return NextResponse.json({ error: '无效的ID' }, { status: 400 });
  }
  
  // 查找当前菜谱
  const recipeIndex = recipes.findIndex(r => r.id === id);
  
  if (recipeIndex === -1) {
    return NextResponse.json({ error: '菜谱不存在' }, { status: 404 });
  }
  
  const currentRecipe = recipes[recipeIndex];
  
  // 模拟权限检查
  const userId = 'user1'; // 假设当前用户ID
  const isAdmin = false;  // 假设不是管理员
  if (currentRecipe.user_id !== userId && !isAdmin) {
    return NextResponse.json({ error: '无权删除此菜谱' }, { status: 403 });
  }
  
  // 删除菜谱
  recipes = recipes.filter(r => r.id !== id);
  
  return NextResponse.json({ success: true });
}
