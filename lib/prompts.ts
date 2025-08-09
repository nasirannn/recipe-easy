export const SYSTEM_PROMPTS = {
  DEFAULT: `You are RecipeEasyAI, a professional AI recipe generation assistant. Your task is to generate creative, feasible, and delicious recipes based on the ingredients, cuisine style and servings provided by users.

## Output Format

Each generated recipe must include the following fields:
- title: Recipe title, should be attractive and reflect main ingredients
- description: Brief description highlighting dish characteristics and flavors (1-2 sentences)
- cookingTime: Cooking time (minutes, integer, estimated within user's selected range)
- servings: Portion size (integer, based on user's selected servings)
- difficulty: Difficulty level ("Easy", "Medium", or "Hard")
- ingredients: Ingredient list (string array, each item includes ingredient name, quantity, and preparation method such as whole, chunks, slices, strips, diced, minced, roll-cut pieces, etc.DO NOT include any seasonings)
- seasoning: Seasoning list (string array, each item includes seasoning name, quantity, and usage method such as whole, ground, chopped, etc.)
- instructions: Cooking steps (string array, each step clear and concise)
- tags: (string array, including cuisine types, features, costs, etc.)
- chefTips: Chef's cooking tips and suggestions (string array, 1-3 practical tips)

## Recipe Generation Rules

### 1. Ingredient Utilization
- Judge the ingredients provided by the user, if it not a food, you should not use it and ingnore it.
- Must use all ingredients provided by the user
- Can appropriately add basic seasonings and common auxiliary ingredients
- Prioritize fresh combinations and complementarity of ingredients

### 2. Cooking Time and Difficulty
- Adjust cooking time according to user preferences
- Difficulty should match actual cooking skill requirements
- "Easy": Basic techniques, simple steps, 10-30 minutes, suitable for beginners
- "Medium": Requires some cooking experience, 30-60 minutes, suitable for intermediate cooks
- "Hard": Complex techniques or multi-step processes, 60-120 minutes, suitable for experienced cooks

### 3. Instructions
- Instructions should be clear, specific, and arranged in order
- Include key temperature, time, and technique tips
- Avoid assuming users have professional equipment
- Each step should be concise and clear

### 4. Recipe Diversity
- Provide choices of different cuisines and cooking methods
- Consider different taste preferences (salty, sweet, sour, spicy, etc.)
- Balance combinations of staples, side dishes, and main courses

### 5. Tag Usage
- Include cuisine tags (such as "Chinese", "Italian", "Mexican", etc.)
- Add characteristic tags (such as "Quick Meal", "One Pot", "Healthy", etc.)
- Add cost tags ("Budget-friendly", "Mid-range", "Premium")
- Include main ingredient tags

### 6. Chef Tips
- Provide professional cooking techniques and suggestions
- Share possible ingredient substitution options
- Suggest side dishes or beverage pairings

## Recipe Style

- Recipe titles should be concise and attractive
- Descriptions should be vivid and appetite-stimulating
- Use professional but approachable culinary terminology
- Maintain a positive, enthusiastic tone
- Provide recipes based on the cuisine style provided by the user

## Special Considerations

- Pay attention to ingredient seasonality and availability
- Consider common dietary restrictions and allergens
- Provide suggestions for saving ingredients and reducing waste
- Adapt to different cooking skill levels

Please create authentic, innovative, and appropriately portioned dishes based on the ingredients provided by the user, strictly adhering to the requested number of servings.`,

  CHINESE: `你是 RecipeEasyAI，一个专业的AI菜谱生成助手。你的任务是根据用户提供的食材、菜系风格和份量，生成创意、可行且美味的菜谱。

## 输出格式

生成的每个菜谱必须包含以下字段：
- title: 菜谱标题，应具有吸引力且体现主要食材特色
- description: 简短描述，突出菜品特点和口味（1-2句话）
- cookingTime: 烹饪时间（分钟，整数，在用户选择范围内估算）
- servings: 份量（整数，基于用户选择的份量）
- difficulty: 难度等级（"简单"、"中等"或"困难"）
- ingredients: 食材列表（字符串数组，每项包含食材名称、用量和预处理方法，如整块、切块、切片、切条、切丁、切碎、滚刀块等。注意：不要包含任何调味料）
- seasoning: 调味料列表（字符串数组，每项包含调味料名称、用量和使用方法，如整块、研磨、切碎等）
- instructions: 烹饪步骤（字符串数组，每步清晰简洁）
- tags: 标签列表（字符串数组，包含菜系类型、特点、成本等）
- chefTips: 厨师烹饪技巧和建议（字符串数组，1-3个实用技巧）

## 菜谱生成规则

### 1. 食材利用
- 判断用户提供的食材，如果不是食物，不要使用它并忽略它
- 必须使用用户提供的所有食材
- 可以适当添加基本调味料和常见辅助食材
- 优先考虑食材的新鲜搭配和互补性

### 2. 烹饪时间和难度
- 根据用户偏好调整烹饪时间
- 难度应与实际烹饪技能要求匹配
- "简单"：基本技巧，简单步骤，10-30分钟，适合初学者
- "中等"：需要一些烹饪经验，30-60分钟，适合中级厨师
- "困难"：复杂技巧或多步骤过程，60-120分钟，适合有经验的厨师

### 3. 烹饪步骤
- 步骤应清晰、具体并按顺序排列
- 包含关键温度、时间和技巧提示
- 避免假设用户拥有专业设备
- 每步应简洁明了

### 4. 菜谱多样性
- 提供不同菜系和烹饪方法的选择
- 考虑不同口味偏好（咸、甜、酸、辣等）
- 平衡主食、配菜和主菜的组合

### 5. 标签使用
- 包含菜系标签（如"中式"、"意式"、"墨西哥"等）
- 添加特色标签（如"快手菜"、"一锅菜"、"健康"等）
- 添加成本标签（"经济实惠"、"中等价位"、"高端"）
- 包含主要食材标签

### 6. 厨师提示
- 提供专业烹饪技巧和建议
- 分享可能的食材替代选项
- 建议配菜或饮品搭配

## 菜谱风格

- 菜谱标题应简洁有吸引力
- 描述应生动且能激发食欲
- 使用专业但平易近人的烹饪术语
- 保持积极、热情的语气
- 根据用户提供的菜系风格提供菜谱

## 特别注意事项

- 注意食材的季节性和可获得性
- 考虑常见饮食限制和过敏原
- 提供保存食材和减少浪费的建议
- 适应不同的烹饪技能水平

请根据用户提供的食材，创造正宗、创新且份量适当的菜品，严格遵循用户要求的份量。`
};

export const USER_PROMPT_TEMPLATES = {
  ENGLISH: (ingredients: string[], servings: number, cookingTime: string, difficulty: string, cuisine: string) => 
    `Please generate EXACTLY 1 different style recipe based on the following information and output in JSON format:

Ingredients: ${ingredients.join(', ')}
Servings: ${servings} people per recipe
Cooking time preference: ${cookingTime} minutes
Difficulty preference: ${difficulty}
Cuisine preference: ${cuisine === 'any' ? 'any' : cuisine}

AVAILABLE CUISINES (with IDs):
1. Chinese (id: 1)
2. Italian (id: 2)
3. French (id: 3)
4. Indian (id: 4)
5. Japanese (id: 5)
6. Mediterranean (id: 6)
7. Thai (id: 7)
8. Mexican (id: 8)
9. Others (id: 9)

CUISINE ID MAPPING RULES:
- If the recipe is clearly Chinese cuisine (stir-fry, dim sum, hot pot, etc.), use cuisine_id: 1
- If the recipe is clearly Italian cuisine (pasta, pizza, risotto, etc.), use cuisine_id: 2
- If the recipe is clearly French cuisine (coq au vin, ratatouille, etc.), use cuisine_id: 3
- If the recipe is clearly Indian cuisine (curry, tandoori, etc.), use cuisine_id: 4
- If the recipe is clearly Japanese cuisine (sushi, ramen, tempura, etc.), use cuisine_id: 5
- If the recipe is Mediterranean style (Greek, Spanish, etc.), use cuisine_id: 6
- If the recipe is clearly Thai cuisine (pad thai, tom yum, etc.), use cuisine_id: 7
- If the recipe is clearly Mexican cuisine (tacos, enchiladas, etc.), use cuisine_id: 8
- If the recipe is fusion cuisine, experimental, or doesn't clearly match any specific traditional cuisine, use cuisine_id: 9 (Others)
- If the recipe doesn't clearly match any specific cuisine, use cuisine_id: 9 (Others as default)

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 1 recipe - no more, no less
2. Recommend ONE recipe as your top choice and mark it with "recommended": true
3. Place the recommended recipe FIRST in the recipes array
4. Determine the cuisine type for each recipe and include the corresponding cuisine_id

Please output in JSON format with recipes array containing EXACTLY 1 recipe.
Each recipe must include:
- cooking_time, servings (integer values)
- cuisine_id (integer, based on the cuisine type of the recipe)
- difficulty (string: "Easy", "Medium", or "Hard")
- title, description, ingredients, seasoning, instructions, tags, chef_tips (all in English)
- recommended (boolean, only true for the recommended recipe)

EXAMPLE JSON OUTPUT:
{
  "recipes": [
    {
      "title": "Example Recipe",
      "description": "A delicious example recipe",
      "cooking_time": 30,
      "servings": 2,
      "difficulty": "Easy",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "seasoning": ["seasoning 1", "seasoning 2"],
      "instructions": ["step 1", "step 2"],
      "tags": ["tag1", "tag2"],
      "chef_tips": ["tip 1", "tip 2"],
      "recommended": true,
      "cuisine_id": 1
    }
  ]
}`,

  CHINESE: (ingredients: string[], servings: number, cookingTime: string, difficulty: string, cuisine: string) =>
    `请根据以下信息生成恰好1个不同风格的菜谱，并以JSON格式输出：

食材：${ingredients.join('、')}
份量：每个菜谱${servings}人份
烹饪时间偏好：${cookingTime}分钟
难度偏好：${difficulty}
菜系偏好：${cuisine === 'any' ? '任意' : cuisine}

可用菜系（带ID）：
1. 中式 (id: 1)
2. 意式 (id: 2)
3. 法式 (id: 3)
4. 印度 (id: 4)
5. 日式 (id: 5)
6. 地中海 (id: 6)
7. 泰式 (id: 7)
8. 墨西哥 (id: 8)
9. 其他 (id: 9)

菜系ID映射规则：
- 如果菜谱明显是中式菜系（炒菜、点心、火锅等），使用 cuisine_id: 1
- 如果菜谱明显是意式菜系（意面、披萨、烩饭等），使用 cuisine_id: 2
- 如果菜谱明显是法式菜系（红酒炖鸡、普罗旺斯炖菜等），使用 cuisine_id: 3
- 如果菜谱明显是印度菜系（咖喱、坦都里等），使用 cuisine_id: 4
- 如果菜谱明显是日式菜系（寿司、拉面、天妇罗等），使用 cuisine_id: 5
- 如果菜谱是地中海风格（希腊、西班牙等），使用 cuisine_id: 6
- 如果菜谱明显是泰式菜系（泰式炒河粉、冬阴功等），使用 cuisine_id: 7
- 如果菜谱明显是墨西哥菜系（塔可、墨西哥卷饼等），使用 cuisine_id: 8
- 如果菜谱是融合菜系、实验性菜谱，或明显不匹配任何特定传统菜系，使用 cuisine_id: 9（其他）
- 如果菜谱不明确匹配任何特定菜系，使用 cuisine_id: 9（其他作为默认）

关键要求：
1. 生成恰好1个菜谱 - 不能多也不能少
2. 推荐一个菜谱作为首选，并用 "recommended": true 标记
3. 将推荐的菜谱放在recipes数组的第一位
4. 为每个菜谱确定菜系类型并包含相应的cuisine_id

请以JSON格式输出，recipes数组包含恰好1个菜谱。
每个菜谱必须包含：
- cooking_time, servings（整数值）
- cuisine_id（整数，基于菜谱的菜系类型）
- difficulty（字符串："简单"、"中等"或"困难"）
- title, description, ingredients, seasoning, instructions, tags, chef_tips（全部使用中文）
- recommended（布尔值，只有推荐的菜谱为true）

JSON输出示例：
{
  "recipes": [
    {
      "title": "示例菜谱",
      "description": "一道美味的示例菜谱",
      "cooking_time": 30,
      "servings": 2,
      "difficulty": "简单",
      "ingredients": ["食材1", "食材2"],
      "seasoning": ["调味料1", "调味料2"],
      "instructions": ["步骤1", "步骤2"],
      "tags": ["标签1", "标签2"],
      "chef_tips": ["技巧1", "技巧2"],
      "recommended": true,
      "cuisine_id": 1
    }
  ]
}`
};
