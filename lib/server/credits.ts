import { PgClientLike, withPgTransaction } from '@/lib/server/postgres';
import { APP_CONFIG } from '@/lib/config';

export type UserCreditsRecord = {
  id: string;
  user_id: string;
  credits: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
};

type DailyLoginBonusBatch = {
  id: string;
  granted_at: string;
  expires_at: string;
  remaining: number;
};

type CreditsBaseRow = {
  id: string;
  user_id: string;
  credits: number;
  total_earned: number;
  total_spent: number;
  created_at: unknown;
  updated_at: unknown;
};

type CreditsSettlementRow = CreditsBaseRow & {
  daily_login_bonus_batches: unknown;
  last_daily_login_bonus_at: unknown;
};

export type DailyLoginBonusSettlement = {
  credits: UserCreditsRecord;
  grantedAmount: number;
  expiredAmount: number;
  expiresAt: string | null;
};

export const DEFAULT_INITIAL_CREDITS = APP_CONFIG.initialCredits;
const DEFAULT_RECIPE_GENERATION_COST = APP_CONFIG.recipeGenerationCost;
const DEFAULT_MIN_CREDITS_FOR_GENERATION = APP_CONFIG.recipeGenerationCost;
const DAILY_LOGIN_BONUS_AMOUNT = 3;
const DAILY_LOGIN_BONUS_DURATION_MS = 24 * 60 * 60 * 1000;

function toIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value ?? '');
}

function toNullableIso(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

function getUtcDayKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameUtcDay(iso: string | null, date: Date): boolean {
  if (!iso) {
    return false;
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return getUtcDayKey(parsed) === getUtcDayKey(date);
}

function normalizeCreditsRow(row: CreditsBaseRow): UserCreditsRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    credits: Number(row.credits ?? 0),
    total_earned: Number(row.total_earned ?? 0),
    total_spent: Number(row.total_spent ?? 0),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function parseDailyLoginBonusBatches(raw: unknown): DailyLoginBonusBatch[] {
  const value = (() => {
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return raw;
  })();

  if (!Array.isArray(value)) {
    return [];
  }

  const batches: DailyLoginBonusBatch[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    const grantedAt = toNullableIso(candidate.granted_at);
    const expiresAt = toNullableIso(candidate.expires_at);
    const parsedRemaining = Number(candidate.remaining);
    const remaining = Math.max(0, Math.floor(Number.isFinite(parsedRemaining) ? parsedRemaining : 0));

    if (!grantedAt || !expiresAt || remaining <= 0) {
      continue;
    }

    const id = typeof candidate.id === 'string' && candidate.id.length > 0
      ? candidate.id
      : crypto.randomUUID();

    batches.push({
      id,
      granted_at: grantedAt,
      expires_at: expiresAt,
      remaining,
    });
  }

  return batches.sort((a, b) => {
    const aTime = new Date(a.expires_at).getTime();
    const bTime = new Date(b.expires_at).getTime();
    return aTime - bTime;
  });
}

function consumeDailyLoginBonusBatches(raw: unknown, amount: number): DailyLoginBonusBatch[] {
  const batches = parseDailyLoginBonusBatches(raw);
  if (amount <= 0 || batches.length === 0) {
    return batches;
  }

  let remainingToSpend = amount;
  const updatedBatches: DailyLoginBonusBatch[] = [];

  for (const batch of batches) {
    let nextRemaining = batch.remaining;

    if (remainingToSpend > 0 && nextRemaining > 0) {
      const consumed = Math.min(nextRemaining, remainingToSpend);
      nextRemaining -= consumed;
      remainingToSpend -= consumed;
    }

    if (nextRemaining > 0) {
      updatedBatches.push({
        ...batch,
        remaining: nextRemaining,
      });
    }
  }

  return updatedBatches;
}

async function readCreditsRowForUpdate(client: PgClientLike, userId: string): Promise<CreditsSettlementRow | null> {
  const result = await client.query<CreditsSettlementRow>(
    `
      SELECT
        id,
        user_id,
        credits,
        total_earned,
        total_spent,
        created_at,
        updated_at,
        daily_login_bonus_batches,
        last_daily_login_bonus_at
      FROM user_credits
      WHERE user_id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function ensureCreditsSchema(db: PgClientLike): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_credits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      credits INTEGER NOT NULL DEFAULT 0,
      total_earned INTEGER NOT NULL DEFAULT 0,
      total_spent INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    ALTER TABLE user_credits
    ADD COLUMN IF NOT EXISTS daily_login_bonus_batches JSONB NOT NULL DEFAULT '[]'::jsonb
  `);

  await db.query(`
    ALTER TABLE user_credits
    ADD COLUMN IF NOT EXISTS last_daily_login_bonus_at TIMESTAMPTZ NULL
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_user_credits_user_id
    ON user_credits(user_id)
  `);
}

export async function getGenerationCost(_db: PgClientLike): Promise<number> {
  return DEFAULT_RECIPE_GENERATION_COST;
}

export async function getMinCreditsForGeneration(_db: PgClientLike): Promise<number> {
  return DEFAULT_MIN_CREDITS_FOR_GENERATION;
}

export async function getUserCredits(
  db: PgClientLike,
  userId: string
): Promise<UserCreditsRecord | null> {
  const result = await db.query<CreditsBaseRow>(
    `
      SELECT id, user_id, credits, total_earned, total_spent, created_at, updated_at
      FROM user_credits
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  const row = result.rows[0];
  return row ? normalizeCreditsRow(row) : null;
}

export async function createUserCredits(
  db: PgClientLike,
  userId: string,
  initialCredits: number
): Promise<UserCreditsRecord> {
  const id = crypto.randomUUID();
  const normalized = Math.max(initialCredits, 0);

  await db.query(
    `
      INSERT INTO user_credits (
        id, user_id, credits, total_earned, total_spent, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 0, NOW(), NOW())
    `,
    [id, userId, normalized, normalized]
  );

  const created = await getUserCredits(db, userId);
  if (!created) {
    throw new Error('Failed to initialize user credits');
  }
  return created;
}

export async function getOrCreateUserCredits(
  db: PgClientLike,
  userId: string
): Promise<UserCreditsRecord> {
  const existing = await getUserCredits(db, userId);
  if (existing) {
    return existing;
  }

  const initialCredits = DEFAULT_INITIAL_CREDITS;

  await db.query(
    `
      INSERT INTO user_credits (
        id, user_id, credits, total_earned, total_spent, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, 0, NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING
    `,
    [crypto.randomUUID(), userId, initialCredits, initialCredits]
  );

  const created = await getUserCredits(db, userId);
  if (!created) {
    throw new Error('Failed to initialize user credits');
  }
  return created;
}

export async function spendCredits(
  db: PgClientLike,
  userId: string,
  amount: number
): Promise<{ credits: UserCreditsRecord; transactionId: string }> {
  const normalized = Math.max(amount, 0);
  if (normalized <= 0) {
    throw new Error('Spend amount must be positive');
  }

  await getOrCreateUserCredits(db, userId);

  return withPgTransaction(async (client) => {
    const current = await readCreditsRowForUpdate(client, userId);
    if (!current) {
      throw new Error('Failed to fetch user credits');
    }

    const availableCredits = Math.max(Number(current.credits ?? 0), 0);
    if (availableCredits < normalized) {
      throw new Error('Insufficient credits');
    }

    const nextBonusBatches = consumeDailyLoginBonusBatches(
      current.daily_login_bonus_batches,
      normalized
    );

    const update = await client.query<CreditsBaseRow>(
      `
        UPDATE user_credits
        SET
          credits = credits - $1,
          total_spent = total_spent + $1,
          daily_login_bonus_batches = $2::jsonb,
          updated_at = NOW()
        WHERE user_id = $3
        RETURNING id, user_id, credits, total_earned, total_spent, created_at, updated_at
      `,
      [normalized, JSON.stringify(nextBonusBatches), userId]
    );

    if (update.rowCount !== 1 || !update.rows[0]) {
      throw new Error('Failed to update credits');
    }

    const transactionId = crypto.randomUUID();
    await client.query(
      `
        INSERT INTO credit_transactions (id, user_id, type, amount, created_at)
        VALUES ($1, $2, 'spend', $3, NOW())
      `,
      [transactionId, userId, normalized]
    );

    return {
      credits: normalizeCreditsRow(update.rows[0]),
      transactionId,
    };
  });
}

export async function settleDailyLoginBonusOnLogin(
  db: PgClientLike,
  userId: string
): Promise<DailyLoginBonusSettlement> {
  const now = new Date();
  const nowIso = now.toISOString();
  const initialCredits = DEFAULT_INITIAL_CREDITS;

  return withPgTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO user_credits (
          id, user_id, credits, total_earned, total_spent, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, 0, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING
      `,
      [crypto.randomUUID(), userId, initialCredits, initialCredits]
    );

    const current = await readCreditsRowForUpdate(client, userId);
    if (!current) {
      throw new Error('Failed to fetch user credits');
    }

    const batches = parseDailyLoginBonusBatches(current.daily_login_bonus_batches);
    const activeBatches: DailyLoginBonusBatch[] = [];
    let expiredRawAmount = 0;

    for (const batch of batches) {
      const expiresAtTime = new Date(batch.expires_at).getTime();
      if (expiresAtTime <= now.getTime()) {
        expiredRawAmount += batch.remaining;
      } else {
        activeBatches.push(batch);
      }
    }

    const currentCredits = Math.max(Number(current.credits ?? 0), 0);
    const expiredAmount = Math.min(currentCredits, Math.max(expiredRawAmount, 0));

    const hasGrantedToday = isSameUtcDay(
      toNullableIso(current.last_daily_login_bonus_at),
      now
    );

    let grantedAmount = 0;
    let expiresAt: string | null = null;
    let nextLastGrantedAt = toNullableIso(current.last_daily_login_bonus_at);
    const nextBatches = [...activeBatches];

    if (!hasGrantedToday) {
      grantedAmount = DAILY_LOGIN_BONUS_AMOUNT;
      expiresAt = new Date(now.getTime() + DAILY_LOGIN_BONUS_DURATION_MS).toISOString();
      nextLastGrantedAt = nowIso;
      nextBatches.push({
        id: crypto.randomUUID(),
        granted_at: nowIso,
        expires_at: expiresAt,
        remaining: grantedAmount,
      });
    }

    const nextCredits = currentCredits - expiredAmount + grantedAmount;

    const updated = await client.query<CreditsBaseRow>(
      `
        UPDATE user_credits
        SET
          credits = $1,
          total_earned = total_earned + $2,
          daily_login_bonus_batches = $3::jsonb,
          last_daily_login_bonus_at = $4,
          updated_at = NOW()
        WHERE user_id = $5
        RETURNING id, user_id, credits, total_earned, total_spent, created_at, updated_at
      `,
      [
        nextCredits,
        grantedAmount,
        JSON.stringify(nextBatches),
        nextLastGrantedAt,
        userId,
      ]
    );

    if (!updated.rows[0]) {
      throw new Error('Failed to settle daily login bonus');
    }

    if (expiredAmount > 0) {
      await client.query(
        `
          INSERT INTO credit_transactions (id, user_id, type, amount, created_at)
          VALUES ($1, $2, 'expire', $3, NOW())
        `,
        [crypto.randomUUID(), userId, expiredAmount]
      );
    }

    if (grantedAmount > 0) {
      await client.query(
        `
          INSERT INTO credit_transactions (id, user_id, type, amount, created_at)
          VALUES ($1, $2, 'daily_login_bonus', $3, NOW())
        `,
        [crypto.randomUUID(), userId, grantedAmount]
      );
    }

    return {
      credits: normalizeCreditsRow(updated.rows[0]),
      grantedAmount,
      expiredAmount,
      expiresAt,
    };
  });
}

export async function earnCredits(
  db: PgClientLike,
  userId: string,
  amount: number
): Promise<{ credits: UserCreditsRecord; transactionId: string }> {
  const normalized = Math.max(amount, 0);
  if (normalized <= 0) {
    throw new Error('Earn amount must be positive');
  }

  return withPgTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO user_credits (
          id, user_id, credits, total_earned, total_spent, created_at, updated_at
        )
        VALUES ($1, $2, $3, $3, 0, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          credits = user_credits.credits + EXCLUDED.credits,
          total_earned = user_credits.total_earned + EXCLUDED.credits,
          updated_at = NOW()
      `,
      [crypto.randomUUID(), userId, normalized]
    );

    const transactionId = crypto.randomUUID();
    await client.query(
      `
        INSERT INTO credit_transactions (id, user_id, type, amount, created_at)
        VALUES ($1, $2, 'earn', $3, NOW())
      `,
      [transactionId, userId, normalized]
    );

    const current = await client.query<{
      id: string;
      user_id: string;
      credits: number;
      total_earned: number;
      total_spent: number;
      created_at: unknown;
      updated_at: unknown;
    }>(
      `
        SELECT id, user_id, credits, total_earned, total_spent, created_at, updated_at
        FROM user_credits
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId]
    );

    if (!current.rows[0]) {
      throw new Error('Failed to fetch updated credits');
    }

    return {
      credits: normalizeCreditsRow(current.rows[0]),
      transactionId,
    };
  });
}
