import { NextRequest, NextResponse } from 'next/server';
import {
  ensureCreditPurchaseSchema,
  finalizeCreditPurchaseByPayPalOrderId,
  getCreditPurchaseOrderByPayPalOrderId,
} from '@/lib/server/credit-purchases';
import { ensureCreditsSchema, getOrCreateUserCredits } from '@/lib/server/credits';
import { getPostgresPool } from '@/lib/server/postgres';
import { capturePayPalOrder, parsePayPalAmountToCents } from '@/lib/server/paypal';
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

function parseCapturePayload(payload: {
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;
}): { captureId: string; status: string; currency: string; amountCents: number } | null {
  const capture = payload.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture?.id || !capture?.amount?.currency_code || !capture?.amount?.value) {
    return null;
  }

  return {
    captureId: capture.id,
    status: capture.status || 'UNKNOWN',
    currency: capture.amount.currency_code,
    amountCents: parsePayPalAmountToCents(capture.amount.value),
  };
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { orderId?: string };
    const payPalOrderId = (body.orderId || '').trim();
    if (!payPalOrderId) {
      return NextResponse.json({ success: false, error: 'Missing order id.' }, { status: 400 });
    }

    const db = getPostgresPool();
    await ensureCreditsSchema(db);
    await ensureCreditPurchaseSchema(db);

    const existingOrder = await getCreditPurchaseOrderByPayPalOrderId(db, {
      payPalOrderId,
      expectedUserId: authData.user.id,
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Purchase order not found.' }, { status: 404 });
    }

    if (existingOrder.credited_at) {
      const credits = await getOrCreateUserCredits(db, authData.user.id);
      return NextResponse.json({
        success: true,
        orderId: payPalOrderId,
        creditsAdded: existingOrder.total_credits,
        creditedNow: false,
        credits,
      });
    }

    let captureData: Awaited<ReturnType<typeof capturePayPalOrder>>;
    try {
      captureData = await capturePayPalOrder(payPalOrderId);
    } catch (error) {
      const latestOrder = await getCreditPurchaseOrderByPayPalOrderId(db, {
        payPalOrderId,
        expectedUserId: authData.user.id,
      });

      if (latestOrder?.credited_at) {
        const credits = await getOrCreateUserCredits(db, authData.user.id);
        return NextResponse.json({
          success: true,
          orderId: payPalOrderId,
          creditsAdded: latestOrder.total_credits,
          creditedNow: false,
          credits,
        });
      }

      throw error;
    }

    const captureSummary = parseCapturePayload(captureData);
    if (!captureSummary) {
      return NextResponse.json(
        { success: false, error: 'PayPal capture payload is invalid.' },
        { status: 502 }
      );
    }

    if (captureSummary.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: `PayPal capture is not completed (status: ${captureSummary.status}).` },
        { status: 409 }
      );
    }

    const finalized = await finalizeCreditPurchaseByPayPalOrderId(db, {
      payPalOrderId,
      payPalCaptureId: captureSummary.captureId,
      expectedUserId: authData.user.id,
      currency: captureSummary.currency,
      amountCents: captureSummary.amountCents,
      rawCapture: captureData,
    });

    return NextResponse.json({
      success: true,
      orderId: payPalOrderId,
      creditsAdded: finalized.order.total_credits,
      creditedNow: finalized.creditedNow,
      credits: finalized.credits,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to capture PayPal order.';
    console.error('[paypal/capture-order]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
