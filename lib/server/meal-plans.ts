import { PgClientLike } from "@/lib/server/postgres";

export type MealPlanMealEntry = {
  title: string;
  description: string;
};

export type MealPlanDay = {
  day: string;
  breakfast: MealPlanMealEntry;
  lunch: MealPlanMealEntry;
  dinner: MealPlanMealEntry;
  snack: MealPlanMealEntry;
};

export type MealPlanRecord = {
  id: string;
  userId: string;
  planTitle: string;
  prompt: string;
  days: MealPlanDay[];
  languageCode: "en" | "zh";
  createdAt?: string;
  updatedAt?: string;
};

type MealPlanRow = {
  id: string;
  user_id: string;
  plan_title: string;
  prompt: string;
  days_json: unknown;
  language_code: string | null;
  created_at: unknown;
  updated_at: unknown;
};

type CreateMealPlanInput = {
  userId: string;
  planTitle: string;
  prompt: string;
  days: MealPlanDay[];
  languageCode?: string;
};

type ListMealPlansByUserOptions = {
  userId: string;
  page?: number;
  limit?: number;
  languageCode?: string;
};

type ListMealPlansByUserResult = {
  results: MealPlanRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  languageCode: "en" | "zh" | "all";
};

let ensureMealPlansSchemaPromise: Promise<void> | null = null;

function normalizePage(input: number | undefined): number {
  if (!Number.isFinite(input)) {
    return 1;
  }
  return Math.max(1, Math.floor(input as number));
}

function normalizeLimit(input: number | undefined): number {
  if (!Number.isFinite(input)) {
    return 20;
  }
  return Math.min(100, Math.max(1, Math.floor(input as number)));
}

function normalizeLanguageCode(input?: string): "en" | "zh" {
  if (!input) {
    return "en";
  }
  return input.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function normalizeListLanguageCode(input?: string): "en" | "zh" | "all" {
  if (!input) {
    return "all";
  }

  if (input.toLowerCase() === "all") {
    return "all";
  }

  return normalizeLanguageCode(input);
}

function toIso(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function normalizeText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed.slice(0, maxLength);
}

function parseDaysPayload(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeMealEntry(
  value: unknown,
  fallbackTitle: string,
  fallbackDescription: string
): MealPlanMealEntry {
  if (typeof value === "string") {
    return {
      title: normalizeText(value, fallbackTitle, 80),
      description: fallbackDescription,
    };
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    return {
      title: normalizeText(source.title, fallbackTitle, 80),
      description: normalizeText(source.description, fallbackDescription, 220),
    };
  }

  return {
    title: fallbackTitle,
    description: fallbackDescription,
  };
}

function normalizeMealPlanDays(input: unknown, languageCode: "en" | "zh"): MealPlanDay[] {
  const rawDays = parseDaysPayload(input);
  const targetDayCount = rawDays.length > 0 ? rawDays.length : 7;

  return Array.from({ length: targetDayCount }, (_, index) => {
    const source =
      rawDays[index] && typeof rawDays[index] === "object"
        ? (rawDays[index] as Record<string, unknown>)
        : {};

    const dayFallback = languageCode === "zh" ? `第${index + 1}天` : `Day ${index + 1}`;
    const day = normalizeText(source.day, dayFallback, 48);

    const breakfast = normalizeMealEntry(
      source.breakfast,
      languageCode === "zh" ? `${day} 早餐` : `${day} Breakfast`,
      languageCode === "zh"
        ? "营养均衡，帮助你开启一天。"
        : "Balanced start to fuel your day."
    );
    const lunch = normalizeMealEntry(
      source.lunch,
      languageCode === "zh" ? `${day} 午餐` : `${day} Lunch`,
      languageCode === "zh"
        ? "食材实用，兼顾饱腹与营养。"
        : "Practical ingredients with steady energy."
    );
    const dinner = normalizeMealEntry(
      source.dinner,
      languageCode === "zh" ? `${day} 晚餐` : `${day} Dinner`,
      languageCode === "zh"
        ? "口味舒适，适合一天收尾。"
        : "Comforting finish for the evening."
    );
    const snack = normalizeMealEntry(
      source.snack,
      languageCode === "zh" ? `${day} 加餐` : `${day} Snack`,
      languageCode === "zh"
        ? "轻量补充，衔接两餐。"
        : "Light bite between main meals."
    );

    return {
      day,
      breakfast,
      lunch,
      dinner,
      snack,
    };
  });
}

function toMealPlanRecord(row: MealPlanRow): MealPlanRecord {
  const languageCode = normalizeLanguageCode(row.language_code ?? "en");
  return {
    id: row.id,
    userId: row.user_id,
    planTitle: normalizeText(row.plan_title, "Meal Plan", 120),
    prompt: normalizeText(row.prompt, "", 2400),
    days: normalizeMealPlanDays(row.days_json, languageCode),
    languageCode,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function ensureMealPlansSchema(db: PgClientLike): Promise<void> {
  if (!ensureMealPlansSchemaPromise) {
    ensureMealPlansSchemaPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS meal_plans (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          plan_title TEXT NOT NULL,
          prompt TEXT NOT NULL,
          days_json JSONB NOT NULL,
          language_code TEXT NOT NULL DEFAULT 'en',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id_created_at
        ON meal_plans (user_id, created_at DESC)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_meal_plans_language_code
        ON meal_plans (language_code)
      `);
    })().catch((error) => {
      ensureMealPlansSchemaPromise = null;
      throw error;
    });
  }

  await ensureMealPlansSchemaPromise;
}

export async function createMealPlan(
  db: PgClientLike,
  input: CreateMealPlanInput
): Promise<MealPlanRecord> {
  await ensureMealPlansSchema(db);

  const languageCode = normalizeLanguageCode(input.languageCode);
  const planTitle = normalizeText(input.planTitle, "Meal Plan", 120);
  const prompt = normalizeText(input.prompt, "", 2400);
  const days = normalizeMealPlanDays(input.days, languageCode);

  const result = await db.query<MealPlanRow>(
    `
      INSERT INTO meal_plans (
        id,
        user_id,
        plan_title,
        prompt,
        days_json,
        language_code,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW(), NOW())
      RETURNING
        id,
        user_id,
        plan_title,
        prompt,
        days_json,
        language_code,
        created_at,
        updated_at
    `,
    [
      crypto.randomUUID(),
      input.userId,
      planTitle,
      prompt,
      JSON.stringify(days),
      languageCode,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to create meal plan");
  }

  return toMealPlanRecord(row);
}

export async function listMealPlansByUser(
  db: PgClientLike,
  options: ListMealPlansByUserOptions
): Promise<ListMealPlansByUserResult> {
  await ensureMealPlansSchema(db);

  const page = normalizePage(options.page);
  const limit = normalizeLimit(options.limit);
  const offset = (page - 1) * limit;
  const languageCode = normalizeListLanguageCode(options.languageCode);

  const whereParts = ["user_id = $1"];
  const values: unknown[] = [options.userId];
  if (languageCode !== "all") {
    whereParts.push(`language_code = $${values.length + 1}`);
    values.push(languageCode);
  }

  const whereSql = whereParts.join(" AND ");
  const countResult = await db.query<{ total: string }>(
    `SELECT COUNT(*)::TEXT AS total FROM meal_plans WHERE ${whereSql}`,
    values
  );
  const total = Number.parseInt(countResult.rows[0]?.total || "0", 10) || 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  const listResult = await db.query<MealPlanRow>(
    `
      SELECT
        id,
        user_id,
        plan_title,
        prompt,
        days_json,
        language_code,
        created_at,
        updated_at
      FROM meal_plans
      WHERE ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `,
    [...values, limit, offset]
  );

  return {
    results: listResult.rows.map(toMealPlanRecord),
    page,
    limit,
    total,
    totalPages,
    languageCode,
  };
}

export async function getMealPlanById(
  db: PgClientLike,
  mealPlanId: string
): Promise<MealPlanRecord | null> {
  await ensureMealPlansSchema(db);

  const id = String(mealPlanId || "").trim().slice(0, 120);
  if (!id) {
    return null;
  }

  const result = await db.query<MealPlanRow>(
    `
      SELECT
        id,
        user_id,
        plan_title,
        prompt,
        days_json,
        language_code,
        created_at,
        updated_at
      FROM meal_plans
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return toMealPlanRecord(row);
}

export async function deleteMealPlanById(
  db: PgClientLike,
  mealPlanId: string,
  userId: string
): Promise<boolean> {
  await ensureMealPlansSchema(db);

  const id = String(mealPlanId || "").trim().slice(0, 120);
  const ownerId = String(userId || "").trim();
  if (!id || !ownerId) {
    return false;
  }

  const result = await db.query<{ id: string }>(
    `
      DELETE FROM meal_plans
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    [id, ownerId]
  );

  return result.rowCount === 1;
}
