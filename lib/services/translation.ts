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
    console.log(`🔧 Translation config check for recipe ${recipe.id}`);
    console.log(`📝 Recipe details:`);
    console.log(`   - Title: "${recipe.title}"`);
    console.log(`   - Language: ${recipe.language || 'undefined'}`);
    console.log(`   - Target language: ${targetLanguage}`);
    console.log(`   - Ingredients: ${recipe.ingredients?.length || 0} items`);
    console.log(`   - Instructions: ${recipe.instructions?.length || 0} items`);
    
    // 获取Qwen Plus配置
    const qwenConfig = {
      model: 'qwen-plus',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: env?.QWENPLUS_API_KEY || process.env.QWENPLUS_API_KEY || '',
      maxTokens: 4000,
      temperature: 0.3,
    };

    console.log(`🔑 API Configuration:`);
    console.log(`   - Model: ${qwenConfig.model}`);
    console.log(`   - Base URL: ${qwenConfig.baseUrl}`);
    console.log(`   - API Key: ${qwenConfig.apiKey ? 'Configured' : 'NOT CONFIGURED'}`);
    console.log(`   - Max Tokens: ${qwenConfig.maxTokens}`);
    console.log(`   - Temperature: ${qwenConfig.temperature}`);

    if (!qwenConfig.apiKey) {
      console.error(`❌ Qwen Plus API key not configured`);
      console.error(`   - env.QWENPLUS_API_KEY: ${env?.QWENPLUS_API_KEY ? 'Set' : 'Not set'}`);
      console.error(`   - process.env.QWENPLUS_API_KEY: ${process.env.QWENPLUS_API_KEY ? 'Set' : 'Not set'}`);
      throw new Error('Qwen Plus API key not configured');
    }

    // 根据目标语言选择合适的系统提示词和用户提示词
    const systemPrompt = targetLanguage === 'zh' ? TRANSLATION_SYSTEM_PROMPTS.CHINESE : TRANSLATION_SYSTEM_PROMPTS.DEFAULT;
    const userPrompt = targetLanguage === 'zh' ? TRANSLATION_USER_PROMPTS.CHINESE(recipe, targetLanguage) : TRANSLATION_USER_PROMPTS.ENGLISH(recipe, targetLanguage);

    console.log(`🚀 Calling Qwen Plus API for recipe ${recipe.id}`);
    console.log(`📡 API URL: ${qwenConfig.baseUrl}/chat/completions`);
    console.log(`📝 System prompt length: ${systemPrompt.length} characters`);
    console.log(`📝 User prompt length: ${userPrompt.length} characters`);

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
    
    console.log(`📤 Request body size: ${JSON.stringify(requestBody).length} characters`);
    
    const startTime = Date.now();
    const response = await fetch(`${qwenConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qwenConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    const endTime = Date.now();
    
    console.log(`📊 API Response received in ${endTime - startTime}ms:`);
    console.log(`   - Status: ${response.status} ${response.statusText}`);
    console.log(`   - Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Qwen Plus API error: ${response.status} ${response.statusText}`);
      console.error(`   Error details: ${errorText}`);
      console.error(`   Response headers:`, Object.fromEntries(response.headers.entries()));
      throw new Error(`Qwen Plus API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json() as any;
    
    console.log(`📥 API Response structure:`);
    console.log(`   - Has choices: ${!!result.choices}`);
    console.log(`   - Choices count: ${result.choices?.length || 0}`);
    console.log(`   - Has message: ${!!result.choices?.[0]?.message}`);
    console.log(`   - Has content: ${!!result.choices?.[0]?.message?.content}`);
    
    if (!result.choices?.[0]?.message?.content) {
      console.error(`❌ Empty or invalid response structure:`, result);
      throw new Error('Empty response from Qwen Plus API');
    }

    // 解析翻译结果
    const content = result.choices[0].message.content;
    console.log(`📝 API Response content length: ${content?.length || 0} characters`);
    console.log(`📝 Content preview: ${content?.substring(0, 200)}...`);
    
    let translationData;

    try {
      translationData = JSON.parse(content);
      console.log(`✅ JSON parsing successful for recipe ${recipe.id}`);
      console.log(`🔍 Parsed data keys:`, Object.keys(translationData));
    } catch (e) {
      console.error(`❌ JSON parsing failed for recipe ${recipe.id}:`, e);
      console.error(`   Raw content: ${content}`);
      console.error(`   Content type: ${typeof content}`);
      throw new Error('Failed to parse translation response');
    }

    // 验证翻译结果
    console.log(`🔍 Validating translation result for recipe ${recipe.id}`);
    const requiredFields = ['title', 'description', 'difficulty', 'ingredients', 'seasoning', 'instructions', 'chefTips', 'tags'];
    for (const field of requiredFields) {
      if (!translationData[field]) {
        console.error(`❌ Missing required field in translation: ${field}`);
        console.error(`   Available fields:`, Object.keys(translationData));
        throw new Error(`Missing required field in translation: ${field}`);
      }
    }

    // 确保数组字段是数组类型
    const arrayFields = ['ingredients', 'seasoning', 'instructions', 'chefTips', 'tags'];
    for (const field of arrayFields) {
      if (!Array.isArray(translationData[field])) {
        console.error(`❌ Field ${field} must be an array, got: ${typeof translationData[field]}`);
        console.error(`   Field value:`, translationData[field]);
        throw new Error(`Field ${field} must be an array`);
      }
      console.log(`   - ${field}: ${translationData[field].length} items`);
    }
    
    console.log(`✅ Translation validation successful for recipe ${recipe.id}`);
    console.log(`🎯 Final translation summary:`);
    console.log(`   - Title: "${translationData.title}"`);
    console.log(`   - Description: "${translationData.description}"`);
    console.log(`   - Difficulty: ${translationData.difficulty}`);

    return translationData as TranslationResult;

  } catch (error) {
    console.error(`❌ Translation failed for recipe ${recipe.id}:`, error);
    // Translation failed
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
    console.log(`💾 Checking existing translation for recipe ${recipeId} in language ${language}`);
    console.log(`📝 Translation data to save:`);
    console.log(`   - Title: "${translation.title}"`);
    console.log(`   - Description: "${translation.description}"`);
    console.log(`   - Difficulty: ${translation.difficulty}`);
    console.log(`   - Ingredients: ${translation.ingredients.length} items`);
    console.log(`   - Seasoning: ${translation.seasoning.length} items`);
    console.log(`   - Instructions: ${translation.instructions.length} items`);
    console.log(`   - Chef tips: ${translation.chefTips.length} items`);
    console.log(`   - Tags: ${translation.tags.length} items`);
    
    // 检查是否已存在翻译
    const existingTranslation = await db.prepare(`
      SELECT id FROM recipes_i18n 
      WHERE recipe_id = ? AND language_code = ?
    `).bind(recipeId, language).first();

    if (existingTranslation) {
      console.log(`🔄 Updating existing translation for recipe ${recipeId} in language ${language}`);
      console.log(`   - Existing translation ID: ${existingTranslation.id}`);
      
      // 更新现有翻译
      const updateResult = await db.prepare(`
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
      
      console.log(`✅ Translation updated for recipe ${recipeId} in language ${language}`);
      console.log(`   - Update result:`, updateResult);
    } else {
      console.log(`🆕 Inserting new translation for recipe ${recipeId} in language ${language}`);
      
      // 插入新翻译
      const insertResult = await db.prepare(`
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
      
      console.log(`✅ Translation inserted for recipe ${recipeId} in language ${language}`);
      console.log(`   - Insert result:`, insertResult);
    }

    console.log(`🎉 Translation saved successfully to database for recipe ${recipeId} in language ${language}`);

  } catch (error) {
    console.error(`❌ Error saving translation to database for recipe ${recipeId}:`, error);
    console.error(`   - Language: ${language}`);
    console.error(`   - Translation data:`, translation);
    if (error instanceof Error) {
      console.error(`   - Error message: ${error.message}`);
      console.error(`   - Error stack: ${error.stack}`);
    }
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
    
    // 检查环境变量
    const apiKey = env?.QWENPLUS_API_KEY || process.env.QWENPLUS_API_KEY;
    if (!apiKey) {
      console.error(`❌ QWENPLUS_API_KEY not configured for recipe ${recipe.id}`);
      return;
    }
    
    // 执行翻译
    console.log(`📝 Translating recipe: "${recipe.title}"`);
    const translation = await translateRecipe(recipe, targetLanguage, env);
    console.log(`✅ Translation completed for recipe ${recipe.id}`);
    
    // 保存到数据库
    console.log(`💾 Saving translation to database for recipe ${recipe.id}`);
    await saveTranslationToDatabase(db, recipe.id, targetLanguage, translation);
    console.log(`✅ Translation saved to database for recipe ${recipe.id}`);

  } catch (error) {
    console.error(`❌ Translation failed for recipe ${recipe.id} to ${targetLanguage}:`, error);
    
    // 记录详细的错误信息
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error stack: ${error.stack}`);
    }
    
    // 不抛出错误，避免影响主流程
  }
}