import { TRANSLATION_SYSTEM_PROMPTS, TRANSLATION_USER_PROMPTS } from '../prompts';
import { PgClientLike } from '@/lib/server/postgres';

export interface TranslationResult {
  title: string;
  description: string;
  difficulty: string;
  servings: number;
  cookingTime: number;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  chefTips: string[];
  tags: string[];
}

export interface RecipeForTranslation {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  servings: number;
  cookingTime: number;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  chefTips: string[];
  tags: string[];
  language?: string;
}

/**
 * 翻译菜谱
 */
export async function translateRecipe(
  recipe: RecipeForTranslation, 
  targetLanguage: string,
  env?: any
): Promise<TranslationResult> {
  try {
    // 获取Qwen Plus配置
    const qwenConfig = {
      model: 'qwen-plus',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: env?.QWENPLUS_API_KEY || process.env.QWENPLUS_API_KEY || '',
      maxTokens: 4000,
      temperature: 0.3,
    };

    if (!qwenConfig.apiKey) {
      throw new Error('Qwen Plus API key not configured');
    }

    // 根据目标语言选择合适的系统提示词和用户提示词
    const systemPrompt = targetLanguage === 'zh' ? TRANSLATION_SYSTEM_PROMPTS.CHINESE : TRANSLATION_SYSTEM_PROMPTS.DEFAULT;
    const userPrompt = targetLanguage === 'zh' ? TRANSLATION_USER_PROMPTS.CHINESE(recipe, targetLanguage) : TRANSLATION_USER_PROMPTS.ENGLISH(recipe, targetLanguage);

    // 调用Qwen Plus API
    const requestBody = {
      model: qwenConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: qwenConfig.maxTokens,
      temperature: qwenConfig.temperature,
      response_format: { type: 'json_object' }
    };
    
    const startTime = Date.now();
    const response = await fetch(`${qwenConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qwenConfig.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable'
      },
      body: JSON.stringify(requestBody)
    });
    const endTime = Date.now();
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qwen Plus API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json() as any;
    
    if (!result.choices?.[0]?.message?.content) {
      throw new Error('Empty response from Qwen Plus API');
    }

    // 解析翻译结果
    const content = result.choices[0].message.content;
    
    let translationData;

    try {
      translationData = JSON.parse(content);
    } catch (e) {
      throw new Error('Failed to parse translation response');
    }

    // 验证翻译结果
    const requiredFields = ['title', 'description', 'difficulty', 'ingredients', 'seasoning', 'instructions', 'chefTips', 'tags'];
    for (const field of requiredFields) {
      if (!translationData[field]) {
        throw new Error(`Missing required field in translation: ${field}`);
      }
    }

    // 确保数组字段是数组类型
    const arrayFields = ['ingredients', 'seasoning', 'instructions', 'chefTips', 'tags'];
    for (const field of arrayFields) {
      if (!Array.isArray(translationData[field])) {
        throw new Error(`Field ${field} must be an array`);
      }
    }
    
    return translationData as TranslationResult;

  } catch (error) {
    // Translation failed
    throw error;
  }
}

/**
 * 保存翻译结果到数据库
 */
export async function saveTranslationToDatabase(
  db: PgClientLike,
  recipeId: string,
  language: string,
  translation: TranslationResult
): Promise<void> {
  try {
    await db.query(
      `
        INSERT INTO recipes_i18n (
          recipe_id,
          language_code,
          title,
          description,
          ingredients,
          seasoning,
          instructions,
          chef_tips,
          tags,
          difficulty,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (recipe_id, language_code) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          ingredients = EXCLUDED.ingredients,
          seasoning = EXCLUDED.seasoning,
          instructions = EXCLUDED.instructions,
          chef_tips = EXCLUDED.chef_tips,
          tags = EXCLUDED.tags,
          difficulty = EXCLUDED.difficulty,
          updated_at = NOW()
      `,
      [
        recipeId,
        language,
        translation.title,
        translation.description,
        JSON.stringify(translation.ingredients),
        JSON.stringify(translation.seasoning),
        JSON.stringify(translation.instructions),
        JSON.stringify(translation.chefTips),
        JSON.stringify(translation.tags),
        translation.difficulty,
      ]
    );
  } catch (error) {
    throw error;
  }
}

/**
 * 异步翻译菜谱（不等待结果）
 */
export async function translateRecipeAsync(
  recipe: RecipeForTranslation,
  targetLanguage: string,
  db: PgClientLike,
  env?: any
): Promise<void> {
  try {
    // 检查环境变量
    const apiKey = env?.QWENPLUS_API_KEY || process.env.QWENPLUS_API_KEY;
    if (!apiKey) {
      return;
    }
    
    // 执行翻译
    const translation = await translateRecipe(recipe, targetLanguage, env);

    // 保存到数据库
    await saveTranslationToDatabase(db, recipe.id, targetLanguage, translation);

  } catch (error) {
    // 不抛出错误，避免影响主流程
  }
}
