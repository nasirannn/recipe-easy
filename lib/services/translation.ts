import { TRANSLATION_SYSTEM_PROMPTS, TRANSLATION_USER_PROMPTS } from '../prompts';

export interface TranslationResult {
  title: string;
  description: string;
  difficulty: string;
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
    console.log('🔧 Translation config check:', {
      hasEnv: !!env,
      hasApiKey: !!(env?.QWENPLUS_API_KEY || process.env.QWENPLUS_API_KEY),
      apiKeyLength: (env?.QWENPLUS_API_KEY || process.env.QWENPLUS_API_KEY || '').length
    });
    
    // 获取Qwen Plus配置
    const qwenConfig = {
      model: 'qwen-plus',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: env?.QWENPLUS_API_KEY || process.env.QWENPLUS_API_KEY || '',
      maxTokens: 4000,
      temperature: 0.3,
    };

    if (!qwenConfig.apiKey) {
      console.error('❌ Qwen Plus API key not configured');
      throw new Error('Qwen Plus API key not configured');
    }

    // 根据目标语言选择合适的系统提示词和用户提示词
    const systemPrompt = targetLanguage === 'zh' ? TRANSLATION_SYSTEM_PROMPTS.CHINESE : TRANSLATION_SYSTEM_PROMPTS.DEFAULT;
    const userPrompt = targetLanguage === 'zh' ? TRANSLATION_USER_PROMPTS.CHINESE(recipe, targetLanguage) : TRANSLATION_USER_PROMPTS.ENGLISH(recipe, targetLanguage);

    // 调用Qwen Plus API
    const response = await fetch(`${qwenConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qwenConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: qwenConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: qwenConfig.maxTokens,
        temperature: qwenConfig.temperature,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qwen Plus API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.choices?.[0]?.message?.content) {
      throw new Error('Empty response from Qwen Plus API');
    }

    // 解析翻译结果
    const content = result.choices[0].message.content;
    let translationData;

    try {
      translationData = JSON.parse(content);
    } catch (e) {
      console.error('Translation JSON parsing failed:', e);
      console.error('Raw content:', content);
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
    console.error('Translation failed:', error);
    throw error;
  }
}

/**
 * 保存翻译结果到数据库
 */
export async function saveTranslationToDatabase(
  db: any,
  recipeId: string,
  language: string,
  translation: TranslationResult
): Promise<void> {
  try {
    // 检查是否已存在翻译
    const existingTranslation = await db.prepare(`
      SELECT id FROM recipes_i18n 
      WHERE recipe_id = ? AND language_code = ?
    `).bind(recipeId, language).first();

    if (existingTranslation) {
      // 更新现有翻译
      await db.prepare(`
        UPDATE recipes_i18n SET
          title = ?,
          description = ?,
          ingredients = ?,
          seasoning = ?,
          instructions = ?,
          chef_tips = ?,
          tags = ?,
          difficulty = ?,
          updated_at = ?
        WHERE recipe_id = ? AND language_code = ?
      `).bind(
        translation.title,
        translation.description,
        JSON.stringify(translation.ingredients),
        JSON.stringify(translation.seasoning),
        JSON.stringify(translation.instructions),
        JSON.stringify(translation.chefTips),
        JSON.stringify(translation.tags),
        translation.difficulty,
        new Date().toISOString(),
        recipeId,
        language
      ).run();
    } else {
      // 插入新翻译
      await db.prepare(`
        INSERT INTO recipes_i18n (
          recipe_id, language_code, title, description, ingredients, 
          seasoning, instructions, chef_tips, tags, difficulty, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
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
        new Date().toISOString(),
        new Date().toISOString()
      ).run();
    }

    console.log(`✅ Translation saved for recipe ${recipeId} in ${language}`);

  } catch (error) {
    console.error('Error saving translation to database:', error);
    throw error;
  }
}

/**
 * 异步翻译菜谱（不等待结果）
 */
export async function translateRecipeAsync(
  recipe: RecipeForTranslation,
  targetLanguage: string,
  db: any,
  env?: any
): Promise<void> {
  try {
    console.log(`🔄 Starting translation for recipe ${recipe.id} to ${targetLanguage}`);
    console.log(`🔑 API Key available: ${!!env?.QWENPLUS_API_KEY}`);
    console.log(`📝 Recipe data:`, {
      id: recipe.id,
      title: recipe.title,
      ingredientsCount: recipe.ingredients?.length,
      instructionsCount: recipe.instructions?.length
    });
    
    // 执行翻译
    const translation = await translateRecipe(recipe, targetLanguage, env);
    
    console.log(`📄 Translation result:`, {
      title: translation.title,
      ingredientsCount: translation.ingredients?.length,
      instructionsCount: translation.instructions?.length
    });
    
    // 保存到数据库
    await saveTranslationToDatabase(db, recipe.id, targetLanguage, translation);
    
    console.log(`✅ Translation completed for recipe ${recipe.id} to ${targetLanguage}`);

  } catch (error) {
    console.error(`❌ Async translation failed for recipe ${recipe.id} to ${targetLanguage}:`, error);
    console.error(`🔍 Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    // 不抛出错误，避免影响主流程
  }
} 