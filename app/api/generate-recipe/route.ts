import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPTS, USER_PROMPT_TEMPLATES } from '@/lib/prompts';
import { API_CONFIG, APP_CONFIG } from '@/lib/config';
import { Recipe } from '@/lib/types';

const modelConfig = {
  deepseek: API_CONFIG.DEEPSEEK,
  qwenplus: API_CONFIG.QWENPLUS,
  'gpt4o-mini': API_CONFIG.GPT4O_MINI,
};

const apiKeys = {
  deepseek: process.env.DEEPSEEK_API_KEY,
  qwenplus: process.env.QWENPLUS_API_KEY,
  'gpt4o-mini': process.env.REPLICATE_API_TOKEN,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ingredients,
      servings,
      recipeCount = APP_CONFIG.DEFAULT_RECIPE_COUNT,
      cookingTime,
      difficulty,
      cuisine,
      language = APP_CONFIG.DEFAULT_LANGUAGE,
      languageModel = APP_CONFIG.DEFAULT_LANGUAGE_MODEL,
    } = body;

    if (!ingredients || ingredients.length < APP_CONFIG.MIN_INGREDIENTS) {
      return NextResponse.json(
        { error: `At least ${APP_CONFIG.MIN_INGREDIENTS} ingredients are required` },
        { status: 400 }
      );
    }

    const validRecipeCount = Math.min(Math.max(1, recipeCount), APP_CONFIG.MAX_RECIPE_COUNT);
    const selectedModelConfig = modelConfig[languageModel as keyof typeof modelConfig] || modelConfig.deepseek;
    const apiKey = apiKeys[languageModel as keyof typeof apiKeys];

    if (!apiKey) {
      return NextResponse.json({ error: `API key for model ${languageModel} is not configured` }, { status: 500 });
    }

    const systemPrompt = language === 'zh' ? SYSTEM_PROMPTS.CHINESE : SYSTEM_PROMPTS.DEFAULT;
    const ingredientNames = ingredients.map((ing: any) => ing.englishName || ing.name);
    const userPrompt = language === 'zh'
      ? USER_PROMPT_TEMPLATES.CHINESE(ingredientNames, servings, cookingTime, difficulty, cuisine, validRecipeCount)
      : USER_PROMPT_TEMPLATES.ENGLISH(ingredientNames, servings, cookingTime, difficulty, cuisine, validRecipeCount);

    // gpt-4o mini 用 Replicate API
    if (languageModel === 'gpt4o-mini') {
      const gpt4oConfig = API_CONFIG.GPT4O_MINI;
      const submitRes = await fetch(`${gpt4oConfig.BASE_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${apiKey}`,
        },
        body: JSON.stringify({
          version: gpt4oConfig.VERSION,
          input: {
            system_prompt: systemPrompt,
            prompt: userPrompt,
            max_tokens: gpt4oConfig.MAX_TOKENS,
            temperature: gpt4oConfig.TEMPERATURE,
          },
        }),
      });
      if (!submitRes.ok) {
        const err = await submitRes.json();
        return NextResponse.json({ error: err.detail || 'Failed to submit Replicate task' }, { status: 500 });
      }
      const submitData = await submitRes.json();
      const predictionId = submitData.id;
      // 2. 轮询获取结果
      let output = null;
      let status = submitData.status;
      let pollCount = 0;
      while (status !== 'succeeded' && status !== 'failed' && pollCount < 30) {
        await new Promise(res => setTimeout(res, 2000));
        const pollRes = await fetch(`${gpt4oConfig.BASE_URL}/predictions/${predictionId}`, {
          headers: { 'Authorization': `Token ${apiKey}` },
        });
        const pollData = await pollRes.json();
        status = pollData.status;
        if (status === 'succeeded') {
          output = pollData.output;
          break;
        }
        pollCount++;
      }
      if (!output) {
        return NextResponse.json({ error: 'Replicate GPT-4o mini 生成超时或失败' }, { status: 500 });
      }
      // 3. 解析 output
      let recipes = [];
      try {
        console.log('GPT-4o mini 原始输出:', output);
        
        let content = Array.isArray(output) ? output.join('') : output;
        
        // 如果内容不是 JSON 格式，尝试提取 JSON 部分
        if (typeof content === 'string') {
          // 查找 JSON 开始和结束位置
          const jsonStart = content.indexOf('{');
          const jsonEnd = content.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            content = content.substring(jsonStart, jsonEnd + 1);
          }
        }
        
        const result = JSON.parse(content);
        recipes = result.recipes || [];
      } catch (e) {
        console.error('解析错误:', e);
        console.error('原始输出:', output);
        return NextResponse.json({ error: 'GPT-4o mini 返回内容解析失败' }, { status: 500 });
      }
      const recipesWithDefaults = recipes.map((recipe: Recipe) => ({
        ...recipe,
        tags: recipe.tags || [],
        chefTips: recipe.chefTips || [],
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || []
      }));
      return NextResponse.json({ recipes: recipesWithDefaults });
    }

    // 其它模型走 OpenAI 兼容 API
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: selectedModelConfig.BASE_URL
    });
    const model = (selectedModelConfig as typeof API_CONFIG.DEEPSEEK | typeof API_CONFIG.QWENPLUS).MODEL;
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
    return NextResponse.json({ recipes: recipesWithDefaults });
  } catch (error) {
    console.error('Recipe generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipes' },
      { status: 500 }
    );
  }
}
