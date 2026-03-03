import { NextRequest, NextResponse } from 'next/server';
import {
  attachPayPalOrderToCreditPurchase,
  createCreditPurchaseOrder,
  ensureCreditPurchaseSchema,
} from '@/lib/server/credit-purchases';
import {
  createPayPalOrder,
  type CreatePayPalOrderPayload,
} from '@/lib/server/paypal';
import {
  formatUsdFromCents,
  getCreditPackageById,
  getCreditPackageTotalCredits,
} from '@/lib/payments/credit-packages';
import { ensureCreditsSchema } from '@/lib/server/credits';
import { getPostgresPool } from '@/lib/server/postgres';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization') || '';
  if (!value.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}

function normalizeLocale(value: unknown): 'en' | 'zh' {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return raw.startsWith('zh') ? 'zh' : 'en';
}

export async function POST(request: NextRequest) {
  let localOrderId: string | null = null;
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      packageId?: string;
      locale?: string;
    };

    const pkg = getCreditPackageById(body.packageId);
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Invalid package.' }, { status: 400 });
    }

    const locale = normalizeLocale(body.locale);
    const db = getPostgresPool();
    await ensureCreditsSchema(db);
    await ensureCreditPurchaseSchema(db);

    const localOrder = await createCreditPurchaseOrder(db, {
      userId: authData.user.id,
      pkg,
    });
    localOrderId = localOrder.id;

    const amount = formatUsdFromCents(pkg.priceCents);
    const totalCredits = getCreditPackageTotalCredits(pkg);
    const origin = new URL(request.url).origin;
    const localePrefix = locale === 'zh' ? '/zh' : '';
    const returnUrl = `${origin}${localePrefix}/pricing/paypal-return`;
    const cancelUrl = `${origin}${localePrefix}/pricing?checkout=cancelled`;

    const payload: CreatePayPalOrderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: pkg.id,
          custom_id: localOrder.id,
          description: `RecipeEasy ${totalCredits} Credits`,
          amount: {
            currency_code: pkg.currency,
            value: amount,
          },
        },
      ],
      application_context: {
        brand_name: 'RecipeEasy',
        landing_page: 'BILLING',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
        locale: locale === 'zh' ? 'zh-CN' : 'en-US',
      },
    };

    const payPalOrder = await createPayPalOrder(payload);
    if (!payPalOrder.id) {
      throw new Error('PayPal did not return order id.');
    }

    await attachPayPalOrderToCreditPurchase(db, {
      localOrderId: localOrder.id,
      payPalOrderId: payPalOrder.id,
      rawOrder: payPalOrder,
    });

    const approvalUrl = payPalOrder.links?.find((link) => link.rel === 'approve')?.href ?? null;
    return NextResponse.json({
      success: true,
      orderId: payPalOrder.id,
      approvalUrl,
    });
  } catch (error) {
    if (localOrderId) {
      try {
        const db = getPostgresPool();
        await db.query(
          `
            UPDATE credit_purchase_orders
            SET status = 'failed', updated_at = NOW()
            WHERE id = $1
          `,
          [localOrderId]
        );
      } catch {
        // keep original error response
      }
    }

    const message = error instanceof Error ? error.message : 'Failed to create PayPal order.';
    console.error('[paypal/create-order]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
