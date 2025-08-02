/**
 * 菜谱API路由
 * 
 * 处理菜谱列表的获取和创建
 */

import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染
// 强制动态渲染
export const runtime = 'edge';

// 菜谱类型定义
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

// 创建菜谱输入类型
interface CreateRecipeInput {
  title: string;
  image_url?: string;
  description?: string;
  tags?: string[];
  cook_time?: number;
  servings?: number;
  difficulty?: string;
  ingredients: any[] | string;
  seasoning?: any[] | string;
  instructions: any[] | string;
  chef_tips?: string;
  cuisine_id?: number;
  user_id?: string;
}

// 静态菜谱数据
const staticRecipes: Recipe[] = [
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

// 存储菜谱数据（模拟数据库）
let recipes = [...staticRecipes];
let nextId = 3;

/**
 * GET /api/recipes
 * 获取菜谱列表
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    const lang = searchParams.get('lang') || 'en';
    const search = searchParams.get('search');
    const cuisineId = searchParams.get('cuisineId');

    // 构建查询参数
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('offset', offset);
    params.append('lang', lang);
    if (search) params.append('search', search);
    if (cuisineId) params.append('cuisineId', cuisineId);

    // 直接调用云端数据库
    const workerUrl = process.env.WORKER_URL || 'https://recipe-easy.annnb016.workers.dev';
    const response = await fetch(`${workerUrl}/api/recipes?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes
 * 创建新菜谱
 */
export async function POST(req: NextRequest) {
  // 验证用户认证
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: '需要授权' }, { status: 401 });
  }
  
  // 验证请求体
  let body: CreateRecipeInput;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 });
  }
  
  // 验证必需字段
  if (!body.title || !body.ingredients || !body.instructions) {
    return NextResponse.json({ error: '缺少必需的字段' }, { status: 400 });
  }
  
  // 处理数组字段
  let ingredients = body.ingredients;
  if (Array.isArray(ingredients)) {
    ingredients = JSON.stringify(ingredients);
  }
  
  let seasoning = body.seasoning;
  if (Array.isArray(seasoning)) {
    seasoning = JSON.stringify(seasoning);
  }
  
  let instructions = body.instructions;
  if (Array.isArray(instructions)) {
    instructions = JSON.stringify(instructions);
  }
  
  // 处理标签
  const tags = body.tags ? body.tags.join(',') : null;
  
  // 创建新菜谱
  const now = new Date().toISOString();
  const newRecipe: Recipe = {
    id: nextId++,
    title: body.title,
    image_url: body.image_url || null,
    description: body.description || null,
    tags,
    cook_time: body.cook_time || null,
    servings: body.servings || null,
    difficulty: body.difficulty || null,
    ingredients: ingredients as string,
    seasoning: seasoning as string || null,
    instructions: instructions as string,
    chef_tips: body.chef_tips || null,
    cuisine_id: body.cuisine_id || null,
    cuisine_name: body.cuisine_id === 1 ? '中餐' : body.cuisine_id === 2 ? '意大利菜' : null,
    user_id: body.user_id || 'user1',
    created_at: now,
    updated_at: now
  };
  
  // 添加到"数据库"
  recipes.push(newRecipe);
  
  return NextResponse.json(newRecipe, { status: 201 });
}
