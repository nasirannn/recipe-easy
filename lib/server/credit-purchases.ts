import { CreditPackage, getCreditPackageTotalCredits } from '@/lib/payments/credit-packages';
import { PgClientLike, withPgTransaction } from '@/lib/server/postgres';

type CreditPurchaseOrderRow = {
  id: string;
  user_id: string;
  package_id: string;
  package_credits: number;
  bonus_credits: number;
  total_credits: number;
  currency: string;
  amount_cents: number;
  provider: string;
  provider_order_id: string | null;
  provider_capture_id: string | null;
  status: string;
  credited_transaction_id: string | null;
  credited_at: unknown;
  created_at: unknown;
  updated_at: unknown;
};

type UserCreditsRow = {
  id: string;
  user_id: string;
  credits: number;
  total_earned: number;
  total_spent: number;
  created_at: unknown;
  updated_at: unknown;
};

export type CreditPurchaseOrder = {
  id: string;
  user_id: string;
  package_id: string;
  package_credits: number;
  bonus_credits: number;
  total_credits: number;
  currency: string;
  amount_cents: number;
  provider: string;
  provider_order_id: string | null;
  provider_capture_id: string | null;
  status: string;
  credited_transaction_id: string | null;
  credited_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserCreditsSnapshot = {
  id: string;
  user_id: string;
  credits: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
};

export type FinalizeCreditPurchaseResult = {
  order: CreditPurchaseOrder;
  credits: UserCreditsSnapshot;
  creditedNow: boolean;
};

function toIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value ?? '');
}

function toNullableIsoString(value: unknown): string | null {
  if (!value) {
    return null;
  }
  return toIsoString(value);
}

function normalizeCreditPurchaseOrder(row: CreditPurchaseOrderRow): CreditPurchaseOrder {
  return {
    id: row.id,
    user_id: row.user_id,
    package_id: row.package_id,
    package_credits: Number(row.package_credits ?? 0),
    bonus_credits: Number(row.bonus_credits ?? 0),
    total_credits: Number(row.total_credits ?? 0),
    currency: row.currency,
    amount_cents: Number(row.amount_cents ?? 0),
    provider: row.provider,
    provider_order_id: row.provider_order_id,
    provider_capture_id: row.provider_capture_id,
    status: row.status,
    credited_transaction_id: row.credited_transaction_id,
    credited_at: toNullableIsoString(row.credited_at),
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}

function normalizeUserCredits(row: UserCreditsRow): UserCreditsSnapshot {
  return {
    id: row.id,
    user_id: row.user_id,
    credits: Number(row.credits ?? 0),
    total_earned: Number(row.total_earned ?? 0),
    total_spent: Number(row.total_spent ?? 0),
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}

async function readUserCredits(client: PgClientLike, userId: string): Promise<UserCreditsSnapshot> {
  const result = await client.query<UserCreditsRow>(
    `
      SELECT id, user_id, credits, total_earned, total_spent, created_at, updated_at
      FROM user_credits
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to read user credits.');
  }

  return normalizeUserCredits(row);
}

export async function ensureCreditPurchaseSchema(db: PgClientLike): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS credit_purchase_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      package_credits INTEGER NOT NULL,
      bonus_credits INTEGER NOT NULL DEFAULT 0,
      total_credits INTEGER NOT NULL,
      currency TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      provider TEXT NOT NULL DEFAULT 'paypal',
      provider_order_id TEXT UNIQUE,
      provider_capture_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'created',
      credited_transaction_id TEXT NULL,
      credited_at TIMESTAMPTZ NULL,
      raw_order JSONB NULL,
      raw_capture JSONB NULL,
      updated_from_webhook_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_credit_purchase_orders_user_id
    ON credit_purchase_orders(user_id)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_credit_purchase_orders_status
    ON credit_purchase_orders(status)
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS paypal_webhook_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      resource_type TEXT NULL,
      order_id TEXT NULL,
      capture_id TEXT NULL,
      payload JSONB NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function createCreditPurchaseOrder(
  db: PgClientLike,
  params: {
    userId: string;
    pkg: CreditPackage;
  }
): Promise<CreditPurchaseOrder> {
  const totalCredits = getCreditPackageTotalCredits(params.pkg);
  const result = await db.query<CreditPurchaseOrderRow>(
    `
      INSERT INTO credit_purchase_orders (
        id,
        user_id,
        package_id,
        package_credits,
        bonus_credits,
        total_credits,
        currency,
        amount_cents,
        provider,
        status,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        'paypal',
        'created',
        NOW(),
        NOW()
      )
      RETURNING
        id,
        user_id,
        package_id,
        package_credits,
        bonus_credits,
        total_credits,
        currency,
        amount_cents,
        provider,
        provider_order_id,
        provider_capture_id,
        status,
        credited_transaction_id,
        credited_at,
        created_at,
        updated_at
    `,
    [
      crypto.randomUUID(),
      params.userId,
      params.pkg.id,
      params.pkg.credits,
      params.pkg.bonusCredits,
      totalCredits,
      params.pkg.currency,
      params.pkg.priceCents,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create purchase order.');
  }

  return normalizeCreditPurchaseOrder(row);
}

export async function attachPayPalOrderToCreditPurchase(
  db: PgClientLike,
  params: {
    localOrderId: string;
    payPalOrderId: string;
    rawOrder: unknown;
  }
): Promise<void> {
  await db.query(
    `
      UPDATE credit_purchase_orders
      SET
        provider_order_id = $1,
        raw_order = $2::jsonb,
        updated_at = NOW()
      WHERE id = $3
    `,
    [params.payPalOrderId, JSON.stringify(params.rawOrder ?? null), params.localOrderId]
  );
}

export async function getCreditPurchaseOrderByPayPalOrderId(
  db: PgClientLike,
  params: {
    payPalOrderId: string;
    expectedUserId?: string;
  }
): Promise<CreditPurchaseOrder | null> {
  const result = await db.query<CreditPurchaseOrderRow>(
    `
      SELECT
        id,
        user_id,
        package_id,
        package_credits,
        bonus_credits,
        total_credits,
        currency,
        amount_cents,
        provider,
        provider_order_id,
        provider_capture_id,
        status,
        credited_transaction_id,
        credited_at,
        created_at,
        updated_at
      FROM credit_purchase_orders
      WHERE provider_order_id = $1
      LIMIT 1
    `,
    [params.payPalOrderId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  if (params.expectedUserId && row.user_id !== params.expectedUserId) {
    throw new Error('Unauthorized purchase access.');
  }

  return normalizeCreditPurchaseOrder(row);
}

export async function markCreditPurchaseOrderStatusByPayPalOrderId(
  db: PgClientLike,
  params: {
    payPalOrderId: string;
    status: string;
  }
): Promise<void> {
  await db.query(
    `
      UPDATE credit_purchase_orders
      SET
        status = $1,
        updated_at = NOW(),
        updated_from_webhook_at = NOW()
      WHERE provider_order_id = $2
    `,
    [params.status, params.payPalOrderId]
  );
}

export async function recordPayPalWebhookEvent(
  db: PgClientLike,
  params: {
    eventId: string;
    eventType: string;
    resourceType?: string | null;
    orderId?: string | null;
    captureId?: string | null;
    payload: unknown;
  }
): Promise<boolean> {
  const result = await db.query(
    `
      INSERT INTO paypal_webhook_events (
        id,
        event_type,
        resource_type,
        order_id,
        capture_id,
        payload,
        processed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      ON CONFLICT (id) DO NOTHING
    `,
    [
      params.eventId,
      params.eventType,
      params.resourceType ?? null,
      params.orderId ?? null,
      params.captureId ?? null,
      JSON.stringify(params.payload ?? null),
    ]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function finalizeCreditPurchaseByPayPalOrderId(
  db: PgClientLike,
  params: {
    payPalOrderId: string;
    payPalCaptureId: string;
    expectedUserId?: string;
    currency: string;
    amountCents: number;
    rawCapture: unknown;
  }
): Promise<FinalizeCreditPurchaseResult> {
  return withPgTransaction(async (client) => {
    const lookup = await client.query<CreditPurchaseOrderRow>(
      `
        SELECT
          id,
          user_id,
          package_id,
          package_credits,
          bonus_credits,
          total_credits,
          currency,
          amount_cents,
          provider,
          provider_order_id,
          provider_capture_id,
          status,
          credited_transaction_id,
          credited_at,
          created_at,
          updated_at
        FROM credit_purchase_orders
        WHERE provider_order_id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [params.payPalOrderId]
    );

    const orderRow = lookup.rows[0];
    if (!orderRow) {
      throw new Error('Purchase order not found.');
    }

    if (params.expectedUserId && orderRow.user_id !== params.expectedUserId) {
      throw new Error('Unauthorized purchase access.');
    }

    const normalizedOrder = normalizeCreditPurchaseOrder(orderRow);

    if (normalizedOrder.credited_at) {
      const credits = await readUserCredits(client, normalizedOrder.user_id);
      return {
        order: normalizedOrder,
        credits,
        creditedNow: false,
      };
    }

    if (normalizedOrder.currency !== params.currency) {
      throw new Error('Currency mismatch when finalizing purchase.');
    }

    if (normalizedOrder.amount_cents !== params.amountCents) {
      throw new Error('Amount mismatch when finalizing purchase.');
    }

    await client.query(
      `
        INSERT INTO user_credits (
          id,
          user_id,
          credits,
          total_earned,
          total_spent,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $3, 0, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          credits = user_credits.credits + EXCLUDED.credits,
          total_earned = user_credits.total_earned + EXCLUDED.credits,
          updated_at = NOW()
      `,
      [crypto.randomUUID(), normalizedOrder.user_id, normalizedOrder.total_credits]
    );

    const creditTransactionId = crypto.randomUUID();
    await client.query(
      `
        INSERT INTO credit_transactions (id, user_id, type, amount, created_at)
        VALUES ($1, $2, 'purchase', $3, NOW())
      `,
      [creditTransactionId, normalizedOrder.user_id, normalizedOrder.total_credits]
    );

    const updateOrderResult = await client.query<CreditPurchaseOrderRow>(
      `
        UPDATE credit_purchase_orders
        SET
          status = 'completed',
          provider_capture_id = $1,
          raw_capture = $2::jsonb,
          credited_transaction_id = $3,
          credited_at = NOW(),
          updated_at = NOW()
        WHERE id = $4
        RETURNING
          id,
          user_id,
          package_id,
          package_credits,
          bonus_credits,
          total_credits,
          currency,
          amount_cents,
          provider,
          provider_order_id,
          provider_capture_id,
          status,
          credited_transaction_id,
          credited_at,
          created_at,
          updated_at
      `,
      [
        params.payPalCaptureId,
        JSON.stringify(params.rawCapture ?? null),
        creditTransactionId,
        normalizedOrder.id,
      ]
    );

    const updatedOrderRow = updateOrderResult.rows[0];
    if (!updatedOrderRow) {
      throw new Error('Failed to update purchase order.');
    }

    const credits = await readUserCredits(client, normalizedOrder.user_id);
    return {
      order: normalizeCreditPurchaseOrder(updatedOrderRow),
      credits,
      creditedNow: true,
    };
  });
}
