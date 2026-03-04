import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { APP_CONFIG, getLanguageConfig } from '@/lib/config';
import { buildMealPlanGenerationPrompts } from '@/lib/meal-plan-generation-prompts';
import { recordModelUsage as saveModelUsage } from '@/lib/server/model-usage';
import {
  ensureCreditsSchema,
  getOrCreateUserCredits,
  spendCredits,
} from '@/lib/server/credits';
import { createMealPlan, ensureMealPlansSchema } from '@/lib/server/meal-plans';
import { getPostgresPool } from '@/lib/server/postgres';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

type MealEntry = {
  title: string;
  description: string;
};

type MealPlanDay = {
  day: string;
  breakfast: MealEntry;
  lunch: MealEntry;
  dinner: MealEntry;
  snack: MealEntry;
};

type MealPlanResult = {
  planTitle: string;
  days: MealPlanDay[];
};

const DEFAULT_MEAL_PLAN_DAY_COUNT = 7;

const ENGLISH_DAY_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
};

const CHINESE_DIGITS: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

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

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function extractJsonPayload(value: string): string {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return value.slice(start, end + 1);
  }

  return value.trim();
}

function getMealFallbackTitle(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  isZh: boolean,
  dayLabel: string
): string {
  if (isZh) {
    switch (mealType) {
      case 'breakfast':
        return `${dayLabel} 早餐`;
      case 'lunch':
        return `${dayLabel} 午餐`;
      case 'dinner':
        return `${dayLabel} 晚餐`;
      case 'snack':
        return `${dayLabel} 加餐`;
      default:
        return `${dayLabel} 加餐`;
    }
  }

  switch (mealType) {
    case 'breakfast':
      return `${dayLabel} Breakfast`;
    case 'lunch':
      return `${dayLabel} Lunch`;
    case 'dinner':
      return `${dayLabel} Dinner`;
    case 'snack':
      return `${dayLabel} Snack`;
    default:
      return `${dayLabel} Snack`;
  }
}

function getMealFallbackDescription(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  isZh: boolean
): string {
  if (isZh) {
    switch (mealType) {
      case 'breakfast':
        return '清爽开胃，适合开启一天。';
      case 'lunch':
        return '营养均衡，适合中午补充能量。';
      case 'dinner':
        return '口味舒适，适合晚间正餐。';
      case 'snack':
        return '清爽轻食，适合作为两餐之间补充。';
      default:
        return '清爽轻食，适合作为两餐之间补充。';
    }
  }

  switch (mealType) {
    case 'breakfast':
      return 'A light and energizing start to your day.';
    case 'lunch':
      return 'Balanced midday meal with practical ingredients.';
    case 'dinner':
      return 'Comforting dinner option for the evening.';
    case 'snack':
      return 'Light snack idea to bridge meals and keep energy steady.';
    default:
      return 'Light snack idea to bridge meals and keep energy steady.';
  }
}

function normalizeMealEntry(
  source: unknown,
  fallbackTitle: string,
  fallbackDescription: string
): MealEntry {
  if (typeof source === 'string') {
    const title = normalizeText(source, 80) ?? fallbackTitle;
    return {
      title,
      description: fallbackDescription,
    };
  }

  if (source && typeof source === 'object') {
    const value = source as Record<string, unknown>;
    const title =
      normalizeText(value.title, 80) ??
      normalizeText(value.name, 80) ??
      normalizeText(value.meal, 80) ??
      normalizeText(value.recipe, 80) ??
      fallbackTitle;
    const description =
      normalizeText(value.description, 180) ??
      normalizeText(value.note, 180) ??
      normalizeText(value.summary, 180) ??
      normalizeText(value.details, 180) ??
      fallbackDescription;

    return { title, description };
  }

  return {
    title: fallbackTitle,
    description: fallbackDescription,
  };
}

function resolveDaysSource(raw: unknown): unknown[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const value = raw as Record<string, unknown>;

  if (Array.isArray(value.days)) {
    return value.days;
  }

  if (Array.isArray(value.plan)) {
    return value.plan;
  }

  if (Array.isArray(value.weekPlan)) {
    return value.weekPlan;
  }

  if (value.days && typeof value.days === 'object') {
    return Object.values(value.days as Record<string, unknown>);
  }

  return [];
}

function parseChineseNumberToken(token: string): number | null {
  if (!token) {
    return null;
  }

  if (/^\d{1,2}$/.test(token)) {
    const parsed = Number.parseInt(token, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const normalized = token.replace(/两/g, "二");
  if (!/^[零一二三四五六七八九十]{1,3}$/.test(normalized)) {
    return null;
  }

  if (!normalized.includes("十")) {
    const value = CHINESE_DIGITS[normalized];
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (normalized === "十") {
    return 10;
  }

  const [leftRaw, rightRaw] = normalized.split("十");
  const left = leftRaw ? CHINESE_DIGITS[leftRaw] : 1;
  const right = rightRaw ? CHINESE_DIGITS[rightRaw] : 0;

  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return null;
  }

  const value = left * 10 + right;
  return value > 0 ? value : null;
}

function sanitizeDayCount(value: number): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  const normalized = Math.floor(value);
  if (normalized < 1 || normalized > 99) {
    return null;
  }

  return normalized;
}

function detectRequestedDayCount(requestText: string): number | null {
  const normalized = requestText.toLowerCase();

  const explicitNumericDayPattern = /\b(\d{1,2})\s*[- ]?\s*day(?:s)?\b/g;
  for (const match of normalized.matchAll(explicitNumericDayPattern)) {
    const rawValue = Number.parseInt(match[1], 10);
    const dayCount = sanitizeDayCount(rawValue);
    if (dayCount) {
      return dayCount;
    }
  }

  const explicitWordDayPattern =
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen)\s+day(?:s)?\b/g;
  for (const match of normalized.matchAll(explicitWordDayPattern)) {
    const rawValue = ENGLISH_DAY_WORDS[match[1]];
    const dayCount = sanitizeDayCount(rawValue);
    if (dayCount) {
      return dayCount;
    }
  }

  const chinesePattern = /([0-9]{1,2}|[零一二两三四五六七八九十]{1,3})\s*天/g;
  for (const match of requestText.matchAll(chinesePattern)) {
    const start = match.index ?? -1;
    const previousChar = start > 0 ? requestText.charAt(start - 1) : "";
    // Skip generic phrases like "每天" that do not indicate total days.
    if (previousChar === "每") {
      continue;
    }

    const rawValue = parseChineseNumberToken(match[1]);
    const dayCount = rawValue ? sanitizeDayCount(rawValue) : null;
    if (dayCount) {
      return dayCount;
    }
  }

  return null;
}

function normalizeMealPlan(raw: unknown, isZh: boolean, targetDayCount: number): MealPlanResult {
  const payload = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const rawDays = resolveDaysSource(payload);
  const defaultPlanTitle = isZh
    ? `${targetDayCount} 天膳食计划`
    : `${targetDayCount} Day Meal Plan`;

  const planTitle =
    normalizeText(payload.planTitle, 90) ??
    normalizeText(payload.title, 90) ??
    defaultPlanTitle;

  const days: MealPlanDay[] = Array.from({ length: targetDayCount }, (_, index) => {
    const dayLabel = isZh ? `第${index + 1}天` : `Day ${index + 1}`;
    const daySource =
      rawDays[index] && typeof rawDays[index] === 'object'
        ? (rawDays[index] as Record<string, unknown>)
        : {};
    const day =
      normalizeText(daySource.day, 40) ??
      normalizeText(daySource.label, 40) ??
      normalizeText(daySource.name, 40) ??
      dayLabel;

    const breakfastSource =
      daySource.breakfast ??
      daySource.morning ??
      daySource.amMeal ??
      daySource.firstMeal;
    const lunchSource =
      daySource.lunch ??
      daySource.midday ??
      daySource.noonMeal ??
      daySource.secondMeal;
    const dinnerSource =
      daySource.dinner ??
      daySource.supper ??
      daySource.evening ??
      daySource.thirdMeal;
    const snackSource =
      daySource.snack ??
      daySource.snacks ??
      daySource.snackMeal ??
      daySource.lightMeal ??
      daySource.fourthMeal;

    const breakfast = normalizeMealEntry(
      breakfastSource,
      getMealFallbackTitle('breakfast', isZh, dayLabel),
      getMealFallbackDescription('breakfast', isZh)
    );
    const lunch = normalizeMealEntry(
      lunchSource,
      getMealFallbackTitle('lunch', isZh, dayLabel),
      getMealFallbackDescription('lunch', isZh)
    );
    const dinner = normalizeMealEntry(
      dinnerSource,
      getMealFallbackTitle('dinner', isZh, dayLabel),
      getMealFallbackDescription('dinner', isZh)
    );
    const snack = normalizeMealEntry(
      snackSource,
      getMealFallbackTitle('snack', isZh, dayLabel),
      getMealFallbackDescription('snack', isZh)
    );

    return {
      day,
      breakfast,
      lunch,
      dinner,
      snack,
    };
  });

  return { planTitle, days };
}

export async function POST(request: NextRequest) {
  let resolvedLanguage = 'en';

  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      prompt?: string;
      language?: string;
    };

    const requestText = normalizeText(body.prompt, 1800);
    resolvedLanguage = typeof body.language === 'string' && body.language.toLowerCase().startsWith('zh')
      ? 'zh'
      : 'en';
    const isZh = resolvedLanguage === 'zh';

    if (!requestText || requestText.length < 10) {
      return NextResponse.json(
        {
          error: isZh ? '请输入至少 10 个字符的需求描述。' : 'Please enter at least 10 characters.',
        },
        { status: 400 }
      );
    }

    const requestedDayCount = detectRequestedDayCount(requestText);
    const targetDayCount = requestedDayCount ?? DEFAULT_MEAL_PLAN_DAY_COUNT;

    const userId = authData.user.id;
    const db = getPostgresPool();
    const mealPlanGenerationCost = APP_CONFIG.mealPlanGenerationCost;

    await ensureCreditsSchema(db);
    await ensureMealPlansSchema(db);

    try {
      const credits = await getOrCreateUserCredits(db, userId);
      if (credits.credits < mealPlanGenerationCost) {
        return NextResponse.json(
          {
            error: isZh
              ? `积分不足，生成膳食计划至少需要 ${mealPlanGenerationCost} 个积分。`
              : `Insufficient credits. You need at least ${mealPlanGenerationCost} credits to generate a meal plan.`,
          },
          { status: 402 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Failed to fetch user credits',
        },
        { status: 500 }
      );
    }

    const spendMealPlanCredits = async (): Promise<NextResponse | null> => {
      try {
        await spendCredits(db, userId, mealPlanGenerationCost);
        return null;
      } catch (error) {
        const details = error instanceof Error ? error.message : 'Unknown error';
        if (details === 'Insufficient credits') {
          return NextResponse.json(
            {
              error: isZh
                ? `积分不足，生成膳食计划至少需要 ${mealPlanGenerationCost} 个积分。`
                : `Insufficient credits. You need at least ${mealPlanGenerationCost} credits to generate a meal plan.`,
            },
            { status: 402 }
          );
        }
        throw error;
      }
    };

    const { systemPrompt, userPrompt } = buildMealPlanGenerationPrompts({
      requestText,
      language: resolvedLanguage,
      dayCount: targetDayCount,
    });

    const modelConfig = getLanguageConfig(resolvedLanguage);
    const finalLanguageModel = resolvedLanguage === 'zh' ? 'qwen-plus' : 'gpt-4o-mini';

    if (!modelConfig.apiKey) {
      return NextResponse.json(
        { error: isZh ? '模型 API Key 未配置。' : 'Model API key is not configured.' },
        { status: 500 }
      );
    }

    if (finalLanguageModel === 'gpt-4o-mini' || modelConfig.model.includes('gpt-4o-mini')) {
      const response = await fetch(`${modelConfig.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${modelConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: modelConfig.model,
          input: {
            system_prompt: systemPrompt,
            prompt: userPrompt,
            max_tokens: modelConfig.maxTokens,
            temperature: modelConfig.temperature,
          },
        }),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: isZh ? '模型调用失败，请稍后再试。' : 'Model request failed. Please try again.' },
          { status: 500 }
        );
      }

      const prediction = (await response.json()) as any;
      let attempts = 0;
      const maxAttempts = 60;
      let result = prediction;

      while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusResponse = await fetch(`${modelConfig.baseUrl}/predictions/${prediction.id}`, {
          headers: {
            Authorization: `Token ${modelConfig.apiKey}`,
          },
        });

        if (statusResponse.ok) {
          result = await statusResponse.json();
        }

        attempts += 1;
      }

      if (!result || result.status !== 'succeeded') {
        return NextResponse.json(
          { error: isZh ? '生成超时或失败，请重试。' : 'Generation timed out or failed. Please retry.' },
          { status: 500 }
        );
      }

      const output = result.output;
      const rawContent = Array.isArray(output) ? output.join('') : String(output ?? '');
      if (!rawContent.trim()) {
        return NextResponse.json(
          { error: isZh ? '模型返回为空，请重试。' : 'Model returned empty output. Please retry.' },
          { status: 500 }
        );
      }

      let parsedContent: unknown;
      try {
        parsedContent = JSON.parse(extractJsonPayload(rawContent));
      } catch (error) {
        return NextResponse.json(
          { error: isZh ? '返回格式解析失败，请重试。' : 'Failed to parse model output.' },
          { status: 500 }
        );
      }

      await recordModelUsage(finalLanguageModel, userId);
      const normalizedPlan = normalizeMealPlan(parsedContent, isZh, targetDayCount);

      const spendResponse = await spendMealPlanCredits();
      if (spendResponse) {
        return spendResponse;
      }

      const savedMealPlan = await createMealPlan(db, {
        userId,
        planTitle: normalizedPlan.planTitle,
        prompt: requestText,
        days: normalizedPlan.days,
        languageCode: resolvedLanguage,
      });

      return NextResponse.json({
        id: savedMealPlan.id,
        planTitle: normalizedPlan.planTitle,
        days: normalizedPlan.days,
      });
    }

    const client = new OpenAI({
      apiKey: modelConfig.apiKey,
      baseURL: modelConfig.baseUrl,
    });

    const requestParams: any = {
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      stream: false,
    };

    if (modelConfig.supportsJsonFormat) {
      requestParams.response_format = { type: 'json_object' };
    }

    const response = await client.chat.completions.create(requestParams);
    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: isZh ? '模型返回为空，请重试。' : 'Model returned empty output. Please retry.' },
        { status: 500 }
      );
    }

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(extractJsonPayload(content));
    } catch (error) {
      return NextResponse.json(
        { error: isZh ? '返回格式解析失败，请重试。' : 'Failed to parse model output.' },
        { status: 500 }
      );
    }

    await recordModelUsage(finalLanguageModel, userId);
    const normalizedPlan = normalizeMealPlan(parsedContent, isZh, targetDayCount);

    const spendResponse = await spendMealPlanCredits();
    if (spendResponse) {
      return spendResponse;
    }

    const savedMealPlan = await createMealPlan(db, {
      userId,
      planTitle: normalizedPlan.planTitle,
      prompt: requestText,
      days: normalizedPlan.days,
      languageCode: resolvedLanguage,
    });

    return NextResponse.json({
      id: savedMealPlan.id,
      planTitle: normalizedPlan.planTitle,
      days: normalizedPlan.days,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : resolvedLanguage === 'zh'
              ? '生成膳食计划失败，请稍后重试。'
              : 'Failed to generate meal plan. Please try again later.',
      },
      { status: 500 }
    );
  }
}
