import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { APP_CONFIG, getLanguageConfig } from '@/lib/config';
import { generateRecipeId } from '@/lib/utils/id-generator';
import { recordModelUsage as saveModelUsage } from '@/lib/server/model-usage';
import { normalizePairingType } from '@/lib/pairing';
import {
  resolveMealType,
  type MealTypePreference,
} from '@/lib/meal-type';
import { buildRecipeGenerationPrompts } from '@/lib/recipe-generation-prompts';
import { normalizeRecipeVibe } from '@/lib/vibe';
import {
  ensureCreditsSchema,
  getOrCreateUserCredits,
  spendCredits,
} from '@/lib/server/credits';
import { getPostgresPool } from '@/lib/server/postgres';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

// 强制动态渲染

async function recordModelUsage(modelName: string, userId: string) {
  try {
    const db = getPostgresPool();
    await saveModelUsage(db, {
      modelName,
      modelType: 'language',
      userId,
    });
  } catch (error) {
    console.error('Failed to record model usage:', error);
  }
}

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization') || '';
  if (!value.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    return Math.round(value * 10) / 10;
  }

  const parsed = Number.parseFloat(String(value));
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.round(parsed * 10) / 10;
}

function pickNullableNumber(...candidates: unknown[]): number | null {
  for (const value of candidates) {
    const parsed = toNullableNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function normalizePairingText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

// 提取公共的数据转换函数
function transformRecipeData(
  recipe: any,
  finalLanguageModel: string,
  language: string,
  requestedMealTypePreference: MealTypePreference
) {
  const recipeId = generateRecipeId();
  const cookingTimeRaw = recipe?.cooking_time ?? recipe?.cookingTime;
  const chefTipsRaw = recipe?.chef_tips ?? recipe?.chefTips;
  const nutrition = recipe?.nutrition && typeof recipe.nutrition === 'object'
    ? recipe.nutrition
    : {};
  const pairingRaw = recipe?.pairing && typeof recipe.pairing === 'object'
    ? recipe.pairing
    : {};
  const pairing = {
    type: normalizePairingType(
      pairingRaw.type ?? recipe.pairingType ?? recipe.pairing_type
    ),
    name: normalizePairingText(pairingRaw.name ?? recipe.pairingName ?? recipe.pairing_name, 80),
    note: normalizePairingText(pairingRaw.note ?? recipe.pairingNote ?? recipe.pairing_note, 120),
    description: normalizePairingText(
      pairingRaw.description ?? recipe.pairingDescription ?? recipe.pairing_description,
      320
    ),
  };
  const hasPairingData = Object.values(pairing).some((value) => value !== null);
  const mealType = resolveMealType(
    requestedMealTypePreference,
    recipe?.meal_type ?? recipe?.mealType ?? recipe?.meal_type_inferred ?? recipe?.mealTypeInferred
  );
  
  return {
    id: recipeId,
    title: recipe.title || '',
    description: recipe.description || '',
    cookingTime: Number(cookingTimeRaw) || 0,     // 统一转换为驼峰
    servings: recipe.servings || 0,
    vibe: normalizeRecipeVibe(recipe.vibe, 'comfort'),
    ingredients: recipe.ingredients || [],
    seasoning: recipe.seasoning || [],
    instructions: recipe.instructions || [],
    tags: recipe.tags || [],
    chefTips: Array.isArray(chefTipsRaw) ? chefTipsRaw : [],           // 统一转换为驼峰
    languageModel: finalLanguageModel,
    language: language,
    mealType,
    pairing: hasPairingData ? pairing : undefined,
    nutrition: {
      calories: pickNullableNumber(nutrition.calories, recipe.calories, recipe.calories_kcal),
      protein: pickNullableNumber(nutrition.protein, recipe.protein, recipe.protein_g),
      carbohydrates: pickNullableNumber(nutrition.carbohydrates, recipe.carbohydrates, recipe.carbohydrates_g),
      fat: pickNullableNumber(nutrition.fat, recipe.fat, recipe.fat_g),
      fiber: pickNullableNumber(nutrition.fiber, recipe.fiber, recipe.fiber_g),
      sugar: pickNullableNumber(nutrition.sugar, recipe.sugar, recipe.sugar_g),
    },
  };
}



export async function POST(request: NextRequest) {
  let ingredients, servings, recipeCount, cookingTime, vibe, cuisine, mealType, language, languageModel, finalLanguageModel;
  
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      ingredients: any[];
      servings: number;
      recipeCount?: number;
      cookingTime: string;
      vibe: string;
      cuisine: string;
      mealType?: string;
      language: string;
      languageModel?: string;
    };
    ({ ingredients, servings, recipeCount, cookingTime, vibe, cuisine, mealType, language, languageModel } = body);
    const userId = authData.user.id;
    const db = getPostgresPool();
    const recipeGenerationCost = APP_CONFIG.recipeGenerationCost;

    await ensureCreditsSchema(db);

    try {
      const credits = await getOrCreateUserCredits(db, userId);
      if (credits.credits < recipeGenerationCost) {
        return NextResponse.json(
          { error: `Insufficient credits. You need at least ${recipeGenerationCost} credits to generate a recipe.` },
          { status: 402 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch user credits' },
        { status: 500 }
      );
    }

    const spendRecipeCredits = async (): Promise<NextResponse | null> => {
      try {
        await spendCredits(db, userId, recipeGenerationCost);
        return null;
      } catch (error) {
        const details = error instanceof Error ? error.message : 'Unknown error';
        if (details === 'Insufficient credits') {
          return NextResponse.json(
            { error: `Insufficient credits. You need at least ${recipeGenerationCost} credits to generate a recipe.` },
            { status: 402 }
          );
        }
        throw error;
      }
    };

    // 验证必要参数
    if (!ingredients || ingredients.length < 2) {
      return NextResponse.json({ error: '至少需要2种食材' }, { status: 400 });
    }



    // 获取基于语言的模型配置
    const modelConfig = getLanguageConfig(language || 'en');
    
    // 根据语言自动选择模型
    finalLanguageModel = language === 'zh' ? 'qwen-plus' : 'gpt-4o-mini';

    if (!modelConfig.apiKey) {
      return NextResponse.json({ error: 'API密钥未配置' }, { status: 500 });
    }

    // 根据用户语言选择提示词
    const {
      systemPrompt,
      userPrompt,
      mealTypePreference,
    } = buildRecipeGenerationPrompts({
      ingredients,
      servings,
      cookingTime,
      vibe,
      cuisine,
      mealType,
      language,
    });

    // 验证提示词是否为空
    if (!systemPrompt || !userPrompt) {
      return NextResponse.json({ error: '提示词生成失败' }, { status: 500 });
    }

    // GPT-4o mini 特殊处理 - 使用 Replicate API
    if (finalLanguageModel === 'gpt-4o-mini' || modelConfig.model.includes('gpt-4o-mini')) {
      const response = await fetch(`${modelConfig.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${modelConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: modelConfig.model,
          input: {
            system_prompt: systemPrompt,
            prompt: userPrompt,
            max_tokens: modelConfig.maxTokens,
            temperature: modelConfig.temperature,
          }
        })
      });

      if (!response.ok) {
        // GPT-4o mini API 错误
        return NextResponse.json({ error: 'GPT-4o mini API 调用失败' }, { status: 500 });
      }

      const prediction = await response.json() as any;


      // 轮询等待结果
      let attempts = 0;
      const maxAttempts = 60; // 2分钟超时
      let result = prediction;

      while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
        
        const statusResponse = await fetch(`${modelConfig.baseUrl}/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Token ${modelConfig.apiKey}`,
          }
        });
        
        if (statusResponse.ok) {
          result = await statusResponse.json();

        }

        attempts++;
      }

      if (!result || result.status !== 'succeeded') {
        throw new Error('Prediction timeout or failed');
      }

      const output = result.output;
      if (!output) {
        throw new Error('Empty response from GPT-4o mini');
      }

      // 记录模型使用情况
      await recordModelUsage(
        finalLanguageModel,
        userId || 'anonymous'
      );

      // 解析 output
      let recipes = [];
      try {
        let content = Array.isArray(output) ? output.join('') : output;
        
        // 如果内容不是 JSON 格式，尝试提取 JSON 部分
        if (typeof content === 'string') {
          const jsonStart = content.indexOf('{');
          const jsonEnd = content.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            content = content.substring(jsonStart, jsonEnd + 1);
          }
        }
        
        const parsedResult = JSON.parse(content);
        recipes = parsedResult.recipes || [];
      } catch (e) {
        // GPT-4o mini 返回内容解析失败
        return NextResponse.json({ error: 'GPT-4o mini 返回内容解析失败' }, { status: 500 });
      }

      const recipesWithDefaults = recipes.map((recipe: any) => 
        transformRecipeData(recipe, finalLanguageModel, language, mealTypePreference)
      );

      const spendResponse = await spendRecipeCredits();
      if (spendResponse) {
        return spendResponse;
      }
      
      return NextResponse.json({ recipes: recipesWithDefaults });
    }

    // 其它模型走 OpenAI 兼容 API
    const client = new OpenAI({
      apiKey: modelConfig.apiKey,
      baseURL: modelConfig.baseUrl
    });

    // 构建请求参数
    const requestParams: any = {
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      stream: false
    };

    // 只有支持JSON格式的模型才添加response_format
    if (modelConfig.supportsJsonFormat) {
      requestParams.response_format = { type: 'json_object' };
    }

    const response = await client.chat.completions.create(requestParams);
    
    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Empty response from API');
    }

    // 记录模型使用情况
    await recordModelUsage(
      finalLanguageModel,
      userId || 'anonymous'
    );

    // 解析返回的JSON
    const content = response.choices[0].message.content;
    let parsedContent;

    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      // JSON解析失败
      return NextResponse.json({ error: 'API返回内容格式无效' }, { status: 500 });
    }

    // 确保返回的是包含recipes数组的对象
    const recipes = parsedContent.recipes || [];
    
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: '没有生成有效的食谱' }, { status: 500 });
    }

    // 为每个食谱添加ID和其他默认值
    const recipesWithDefaults = recipes.map((recipe: any) => 
      transformRecipeData(recipe, finalLanguageModel, language, mealTypePreference)
    );

    const spendResponse = await spendRecipeCredits();
    if (spendResponse) {
      return spendResponse;
    }
    
    return NextResponse.json({ recipes: recipesWithDefaults });

  } catch (error) {
    // 食谱生成错误
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '食谱生成失败' 
    }, { status: 500 });
  }
}
