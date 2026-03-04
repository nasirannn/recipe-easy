type BuildMealPlanPromptsInput = {
  requestText: string;
  language: string;
  dayCount: number;
};

type BuildMealPlanPromptsOutput = {
  systemPrompt: string;
  userPrompt: string;
};

export function buildMealPlanGenerationPrompts({
  requestText,
  language,
  dayCount,
}: BuildMealPlanPromptsInput): BuildMealPlanPromptsOutput {
  const isZh = language.toLowerCase().startsWith("zh");

  if (isZh) {
    return {
      systemPrompt: [
        "你是一位专业营养师与家庭膳食规划助手。",
        `请根据用户输入，生成一个可执行的 ${dayCount} 天四餐计划。`,
        "请确保输出是严格 JSON，不要输出 markdown 代码块，不要解释说明。",
        "每一天必须包含 breakfast / lunch / dinner / snack 四餐。",
        "每餐包含 title 和 description。",
        "title 简洁（建议 3-10 个字），description 简洁（建议 10-30 个字）。",
      ].join("\n"),
      userPrompt: [
        `用户需求：${requestText}`,
        "",
        "请严格按照以下 JSON 结构返回：",
        "{",
        `  "planTitle": "${dayCount} 天膳食计划",`,
        '  "days": [',
        "    {",
        '      "day": "第1天",',
        '      "breakfast": { "title": "示例", "description": "示例说明" },',
        '      "lunch": { "title": "示例", "description": "示例说明" },',
        '      "dinner": { "title": "示例", "description": "示例说明" },',
        '      "snack": { "title": "示例", "description": "示例说明" }',
        "    }",
        "  ]",
        "}",
        "",
        "约束：",
        `1) 必须生成 ${dayCount} 天（第1天~第${dayCount}天）`,
        "2) 每天必须有 breakfast/lunch/dinner/snack 四个字段",
        "3) 严格返回 JSON，不要包含其他文本",
      ].join("\n"),
    };
  }

  return {
    systemPrompt: [
      "You are a professional nutrition and meal-planning assistant.",
      `Create a practical ${dayCount}-day meal plan based on user requirements.`,
      "Return strict JSON only. No markdown fences and no explanatory text.",
      "Each day must include breakfast, lunch, dinner, and snack.",
      "Each meal must include title and description.",
      "Keep titles concise (3-8 words) and descriptions concise (8-20 words).",
    ].join("\n"),
    userPrompt: [
      `User request: ${requestText}`,
      "",
      "Return JSON in this exact shape:",
      "{",
      `  "planTitle": "${dayCount} Day Meal Plan",`,
      '  "days": [',
      "    {",
      '      "day": "Day 1",',
      '      "breakfast": { "title": "Example", "description": "Example description" },',
      '      "lunch": { "title": "Example", "description": "Example description" },',
      '      "dinner": { "title": "Example", "description": "Example description" },',
      '      "snack": { "title": "Example", "description": "Example description" }',
      "    }",
      "  ]",
      "}",
      "",
      "Constraints:",
      `1) Generate exactly ${dayCount} days (Day 1 to Day ${dayCount}).`,
      "2) Every day must contain breakfast/lunch/dinner/snack keys.",
      "3) Return JSON only.",
    ].join("\n"),
  };
}
