import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPTS, USER_PROMPT_TEMPLATES } from '@/lib/prompts';
import { API_CONFIG, APP_CONFIG } from '@/lib/config';
import { Recipe } from '@/lib/types';

// 强制动态渲染
export const dynamic = 'force-dynamic';

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
  try {
    const body = await request.json();
    const { ingredients, servings, recipeCount, cookingTime, difficulty, cuisine, languageModel, userId, isAdmin } = body;

    // 验证必要参数
    if (!ingredients || ingredients.length < 2) {
      return NextResponse.json({ error: '至少需要2种食材' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: '用户ID是必需的' }, { status: 400 });
    }

    // 选择语言模型配置
    const selectedModelConfig = languageModel ? API_CONFIG[languageModel] : API_CONFIG.DEEPSEEK;
    const apiKey = selectedModelConfig.API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API密钥未配置' }, { status: 500 });
    }

    // 构建系统提示词
    const systemPrompt = `你是一个专业的AI厨师助手，专门为用户生成美味的食谱。请根据用户提供的食材，生成${recipeCount}个详细的食谱。

要求：
1. 每个食谱必须包含：标题、食材清单、详细步骤、烹饪时间、难度等级、营养信息、厨师小贴士、标签
2. 食材用量要精确，步骤要详细易懂
3. 烹饪时间：${cookingTime}
4. 难度等级：${difficulty}
5. 菜系风格：${cuisine}
6. 份数：${servings}人份
7. 只使用用户提供的食材，不要添加其他食材
8. 返回格式必须是有效的JSON

请返回以下JSON格式：
{
  "recipes": [
    {
      "title": "食谱标题",
      "ingredients": [
        {
          "name": "食材名称",
          "amount": "用量",
          "unit": "单位"
        }
      ],
      "instructions": [
        "步骤1",
        "步骤2"
      ],
      "cookingTime": "烹饪时间",
      "difficulty": "难度等级",
      "servings": "份数",
      "cuisine": "菜系",
      "nutrition": {
        "calories": "卡路里",
        "protein": "蛋白质",
        "carbs": "碳水化合物",
        "fat": "脂肪"
      },
      "chefTips": [
        "厨师小贴士1",
        "厨师小贴士2"
      ],
      "tags": ["标签1", "标签2"]
    }
  ]
}`;

    // 构建用户提示词
    const userPrompt = `请根据以下食材生成${recipeCount}个美味的食谱：

食材清单：
${ingredients.map((ingredient: any) => `- ${ingredient.name} ${ingredient.amount}${ingredient.unit}`).join('\n')}

要求：
- 烹饪时间：${cookingTime}
- 难度等级：${difficulty}
- 菜系风格：${cuisine}
- 份数：${servings}人份
- 只使用上述食材，不要添加其他食材
- 确保每个食谱都是完整且可执行的`;

    // GPT-4o mini 特殊处理
    if (languageModel === 'gpt4o_mini') {
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: selectedModelConfig.BASE_URL
      });

      const response = await client.chat.completions.create({
        model: selectedModelConfig.MODEL,
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
      
      // 扣减积分（仅非管理员用户）
      let transactionId = null;
      if (!isAdmin) {
        const workerUrl = process.env.WORKER_URL || 'https://recipe-easy.annnb016.workers.dev';
        const spendResponse = await fetch(`${workerUrl}/api/user-usage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            action: 'spend',
            amount: 1,
            description: 'Generated recipe with GPT-4o mini'
          }),
        });

        if (spendResponse.ok) {
          const spendResult = await spendResponse.json();
          
          if (spendResult.success && spendResult.data?.transactionId) {
            transactionId = spendResult.data.transactionId;
          } else {
            console.error('GPT-4o mini扣减积分失败:', spendResult);
          }
        } else {
          console.error('GPT-4o mini扣减积分请求失败:', spendResponse.status);
        }
      }
      
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

    // 扣减积分（仅非管理员用户）
    let transactionId = null;
    if (!isAdmin) {
      const workerUrl = process.env.WORKER_URL || 'https://recipe-easy.annnb016.workers.dev';
      const spendResponse = await fetch(`${workerUrl}/api/user-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'spend',
          amount: 1,
          description: 'Generated recipe'
        }),
      });

      if (spendResponse.ok) {
        const spendResult = await spendResponse.json();
        
        if (spendResult.success && spendResult.data?.transactionId) {
          transactionId = spendResult.data.transactionId;
        } else {
          console.error('扣减积分失败:', spendResult);
        }
      } else {
        console.error('扣减积分请求失败:', spendResponse.status);
      }
    }

    return NextResponse.json({ recipes: recipesWithDefaults });
  } catch (error) {
    console.error('Recipe generation error:', error);
    return NextResponse.json({ error: 'Recipe generation failed' }, { status: 500 });
  }
}
