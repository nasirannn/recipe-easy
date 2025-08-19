import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPTS, USER_PROMPT_TEMPLATES } from '@/lib/prompts';
import { getLanguageConfig } from '@/lib/config';
import { generateRecipeId } from '@/lib/utils/id-generator';

// 强制动态渲染
export const runtime = 'edge';

// 记录模型使用情况的函数（已禁用，Worker已删除）
async function recordModelUsage(modelName: string, modelResponseId: string, requestDetails: string) {
  // Worker已删除，模型使用记录功能暂时禁用

}

// 提取公共的数据转换函数
function transformRecipeData(recipe: any, finalLanguageModel: string, language: string) {
  const recipeId = generateRecipeId();
  
  return {
    id: recipeId,
    title: recipe.title || '',
    description: recipe.description || '',
    cookingTime: recipe.cooking_time || 0,     // 统一转换为驼峰
    servings: recipe.servings || 0,
    difficulty: recipe.difficulty || 'medium',
    ingredients: recipe.ingredients || [],
    seasoning: recipe.seasoning || [],
    instructions: recipe.instructions || [],
    tags: recipe.tags || [],
    chefTips: recipe.chef_tips || [],           // 统一转换为驼峰
    recommended: recipe.recommended || false,
    languageModel: finalLanguageModel,
    language: language
  };
}

export async function POST(request: NextRequest) {
  let ingredients, servings, recipeCount, cookingTime, difficulty, cuisine, language, languageModel, userId, finalLanguageModel;
  const isAdmin = false; // 暂时禁用管理员功能
  
  try {
    const body = await request.json();
    ({ ingredients, servings, recipeCount, cookingTime, difficulty, cuisine, language, languageModel, userId } = body);

    // 验证必要参数
    if (!ingredients || ingredients.length < 2) {
      return NextResponse.json({ error: '至少需要2种食材' }, { status: 400 });
    }

    // 获取基于语言的模型配置
    const modelConfig = getLanguageConfig(language || 'en');
    
    // 管理员可以选择模型，普通用户使用基于语言的默认模型
    if (isAdmin && languageModel) {
      // 管理员指定了模型，使用指定模型（需要向后兼容）
      finalLanguageModel = languageModel;
    } else {
      // 根据语言自动选择模型
      finalLanguageModel = language === 'zh' ? 'qwen-plus' : 'gpt-4o-mini';
    }

    if (!modelConfig.apiKey) {
      return NextResponse.json({ error: 'API密钥未配置' }, { status: 500 });
    }

    // 根据用户语言选择提示词
    let systemPrompt, userPrompt;
    const ingredientNames = ingredients.map((ingredient: any) => ingredient.name);
    
    if (language === 'zh' || language === 'zh-CN') {

      // 中文用户使用中文提示词
      systemPrompt = SYSTEM_PROMPTS.CHINESE;
      userPrompt = `${USER_PROMPT_TEMPLATES.CHINESE}\n\n食材：${ingredientNames.join(', ')}\n份量：${servings}\n烹饪时间：${cookingTime}\n难度：${difficulty}\n菜系：${cuisine}`;
    } else {
      // 英文用户使用英文提示词
      systemPrompt = SYSTEM_PROMPTS.DEFAULT;
      userPrompt = `${USER_PROMPT_TEMPLATES.ENGLISH}\n\nIngredients: ${ingredientNames.join(', ')}\nServings: ${servings}\nCooking Time: ${cookingTime}\nDifficulty: ${difficulty}\nCuisine: ${cuisine}`;
    }

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
        console.error('GPT-4o mini API 错误:', response.statusText);
        return NextResponse.json({ error: 'GPT-4o mini API 调用失败' }, { status: 500 });
      }

      const prediction = await response.json();


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
        prediction.id,
        userPrompt
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
        console.error('GPT-4o mini 返回内容解析失败:', e);
        console.error('原始输出:', output);
        return NextResponse.json({ error: 'GPT-4o mini 返回内容解析失败' }, { status: 500 });
      }

      const recipesWithDefaults = recipes.map((recipe: any) => 
        transformRecipeData(recipe, finalLanguageModel, language)
      );
      
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
      response.id,
      userPrompt
    );

    // 解析返回的JSON
    const content = response.choices[0].message.content;
    let parsedContent;

    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error('JSON解析失败:', e);
      console.error('返回内容:', content);
      return NextResponse.json({ error: 'API返回内容格式无效' }, { status: 500 });
    }

    // 确保返回的是包含recipes数组的对象
    const recipes = parsedContent.recipes || [];
    
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: '没有生成有效的食谱' }, { status: 500 });
    }

    // 为每个食谱添加ID和其他默认值
    const recipesWithDefaults = recipes.map((recipe: any) => 
      transformRecipeData(recipe, finalLanguageModel, language)
    );
    
    return NextResponse.json({ recipes: recipesWithDefaults });

  } catch (error) {
    console.error('食谱生成错误:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '食谱生成失败' 
    }, { status: 500 });
  }
}
