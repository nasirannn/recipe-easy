import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPTS, USER_PROMPT_TEMPLATES } from '@/lib/prompts';
import { API_CONFIG, APP_CONFIG, getRecommendedModels } from '@/lib/config';
import { Recipe } from '@/lib/types';

// 强制动态渲染
// 强制动态渲染
export const runtime = 'edge';

const modelConfig = {
  deepseek: API_CONFIG.DEEPSEEK,
  qwenplus: API_CONFIG.QWENPLUS,
  gpt4o_mini: API_CONFIG.GPT4o_MINI,
};

const apiKeys = {
  deepseek: process.env.DEEPSEEK_API_KEY,
  qwenplus: process.env.QWENPLUS_API_KEY,
  gpt4o_mini: process.env.REPLICATE_API_TOKEN,
};

export async function POST(request: NextRequest) {
  let ingredients, servings, recipeCount, cookingTime, difficulty, cuisine, language, languageModel, userId, isAdmin, finalLanguageModel;
  
  try {
    const body = await request.json();
    ({ ingredients, servings, recipeCount, cookingTime, difficulty, cuisine, language, languageModel, userId, isAdmin } = body);

    // 验证必要参数
    if (!ingredients || ingredients.length < 2) {
      return NextResponse.json({ error: '至少需要2种食材' }, { status: 400 });
    }

    // 移除userId必需验证，允许未登录用户生成菜谱
    // if (!userId) {
    //   return NextResponse.json({ error: '用户ID是必需的' }, { status: 400 });
    // }

    // 根据语言自动选择模型（非管理员用户）
    let finalLanguageModel = languageModel;
    if (!isAdmin) {
      const recommendedModels = getRecommendedModels(language || 'en');
      finalLanguageModel = recommendedModels.languageModel;
    }

    // 选择语言模型配置
    const selectedModelConfig = finalLanguageModel && API_CONFIG[finalLanguageModel] ? API_CONFIG[finalLanguageModel] : API_CONFIG.DEEPSEEK;
    const apiKey = selectedModelConfig.API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API密钥未配置' }, { status: 500 });
    }

    // 根据语言选择系统提示词
    const isChinese = language === 'zh' || language === 'zh-CN';
    const systemPrompt = isChinese ? SYSTEM_PROMPTS.CHINESE : SYSTEM_PROMPTS.DEFAULT;

    // 构建用户提示词
    const ingredientNames = ingredients.map((ingredient: any) => ingredient.name);
    const userPrompt = isChinese ? 
      USER_PROMPT_TEMPLATES.CHINESE(ingredientNames, servings, cookingTime, difficulty, cuisine, recipeCount) :
      USER_PROMPT_TEMPLATES.ENGLISH(ingredientNames, servings, cookingTime, difficulty, cuisine, recipeCount);

    // GPT-4o mini 特殊处理
    if (finalLanguageModel === 'gpt4o_mini') {
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: selectedModelConfig.BASE_URL
      });

      const response = await client.chat.completions.create({
        model: selectedModelConfig.MODEL, // 现在所有模型都使用MODEL字段
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: selectedModelConfig.MAX_TOKENS,
        temperature: selectedModelConfig.TEMPERATURE,
        stream: false
      });

      const output = response.choices[0].message.content;
      if (!output) {
        throw new Error('Empty response from GPT-4o mini');
      }

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
        
        const result = JSON.parse(content);
        recipes = result.recipes || [];
      } catch (e) {
        console.error('GPT-4o mini 返回内容解析失败:', e);
        return NextResponse.json({ error: 'GPT-4o mini 返回内容解析失败' }, { status: 500 });
      }

      const recipesWithDefaults = recipes.map((recipe: Recipe) => ({
        ...recipe,
        tags: recipe.tags || [],
        chefTips: recipe.chefTips || [],
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || []
      }));
      
      // 移除积分扣减逻辑 - 现在只在生成图片时扣减
      // 扣减积分（仅非管理员用户）
      // let transactionId = null;
      // if (!isAdmin) {
      //   const workerUrl = process.env.WORKER_URL || 'https://recipe-easy.annnb016.workers.dev';
      //   const spendResponse = await fetch(`${workerUrl}/api/user-usage`, {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       userId,
      //       action: 'spend',
      //       amount: 1,
      //       description: 'Generated recipe with GPT-4o mini'
      //     }),
      //   });

      //   if (spendResponse.ok) {
      //     const spendResult = await spendResponse.json();
          
      //     if (spendResult.success && spendResult.data?.transactionId) {
      //       transactionId = spendResult.data.transactionId;
      //     } else {
      //       console.error('GPT-4o mini扣减积分失败:', spendResult);
      //     }
      //   } else {
      //     console.error('GPT-4o mini扣减积分请求失败:', spendResponse.status);
      //   }
      // }
      
      return NextResponse.json({ recipes: recipesWithDefaults });
    }

    // 其它模型走 OpenAI 兼容 API
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: selectedModelConfig.BASE_URL
    });
    const model = selectedModelConfig.MODEL;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: selectedModelConfig.MAX_TOKENS,
      temperature: selectedModelConfig.TEMPERATURE,
      stream: false
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from API');
    }

    const result = JSON.parse(content);
    const recipesWithDefaults = result.recipes.map((recipe: Recipe) => ({
      ...recipe,
      tags: recipe.tags || [],
      chefTips: recipe.chefTips || [],
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || []
    }));

    // 移除积分扣减逻辑 - 现在只在生成图片时扣减
    // 扣减积分（仅非管理员用户）
    // let transactionId = null;
    // if (!isAdmin) {
    //   const workerUrl = process.env.WORKER_URL || 'https://recipe-easy.annnb016.workers.dev';
    //   const spendResponse = await fetch(`${workerUrl}/api/user-usage`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       userId,
    //       action: 'spend',
    //       amount: 1,
    //       description: 'Generated recipe'
    //     }),
    //   });

    //   if (spendResponse.ok) {
    //     const spendResult = await spendResponse.json();
        
    //     if (spendResult.success && spendResult.data?.transactionId) {
    //       transactionId = spendResult.data.transactionId;
    //     } else {
    //       console.error('扣减积分失败:', spendResult);
    //     }
    //   } else {
    //     console.error('扣减积分请求失败:', spendResponse.status);
    //   }
    // }

    return NextResponse.json({ recipes: recipesWithDefaults });
  } catch (error) {
    console.error('Recipe generation error:', error);
    return NextResponse.json({ 
      error: 'Recipe generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
