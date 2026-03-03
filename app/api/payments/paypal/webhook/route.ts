import { NextRequest, NextResponse } from 'next/server';
import {
  ensureCreditPurchaseSchema,
  finalizeCreditPurchaseByPayPalOrderId,
  markCreditPurchaseOrderStatusByPayPalOrderId,
  recordPayPalWebhookEvent,
} from '@/lib/server/credit-purchases';
import { ensureCreditsSchema } from '@/lib/server/credits';
import { getPostgresPool } from '@/lib/server/postgres';
import {
  getPayPalWebhookId,
  parsePayPalAmountToCents,
  verifyPayPalWebhookSignature,
} from '@/lib/server/paypal';

export const runtime = 'nodejs';

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource_type?: string;
  resource?: {
    id?: string;
    amount?: {
      currency_code?: string;
      value?: string;
    };
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
        capture_id?: string;
      };
    };
  };
};

function readRequiredHeader(request: NextRequest, name: string): string | null {
  const value = request.headers.get(name);
  return value ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const webhookId = getPayPalWebhookId();
    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: 'PAYPAL_WEBHOOK_ID is not configured.' },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const event = JSON.parse(rawBody) as PayPalWebhookEvent;

    const transmissionId = readRequiredHeader(request, 'paypal-transmission-id');
    const transmissionTime = readRequiredHeader(request, 'paypal-transmission-time');
    const transmissionSig = readRequiredHeader(request, 'paypal-transmission-sig');
    const authAlgo = readRequiredHeader(request, 'paypal-auth-algo');
    const certUrl = readRequiredHeader(request, 'paypal-cert-url');

    if (!transmissionId || !transmissionTime || !transmissionSig || !authAlgo || !certUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing PayPal signature headers.' },
        { status: 400 }
      );
    }

    const verified = await verifyPayPalWebhookSignature({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: event as Record<string, unknown>,
    });

    if (!verified) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature.' }, { status: 400 });
    }

    const eventId = (event.id || '').trim();
    const eventType = (event.event_type || '').trim();
    if (!eventId || !eventType) {
      return NextResponse.json({ success: false, error: 'Invalid PayPal webhook payload.' }, { status: 400 });
    }

    const orderId = event.resource?.supplementary_data?.related_ids?.order_id || event.resource?.id || null;
    const captureId =
      event.resource?.supplementary_data?.related_ids?.capture_id || event.resource?.id || null;

    const db = getPostgresPool();
    await ensureCreditsSchema(db);
    await ensureCreditPurchaseSchema(db);

    const accepted = await recordPayPalWebhookEvent(db, {
      eventId,
      eventType,
      resourceType: event.resource_type ?? null,
      orderId,
      captureId,
      payload: event,
    });

    if (!accepted) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    if (eventType === 'CHECKOUT.ORDER.APPROVED' && orderId) {
      await markCreditPurchaseOrderStatusByPayPalOrderId(db, {
        payPalOrderId: orderId,
        status: 'approved',
      });
    }

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const payPalOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
      const payPalCaptureId = event.resource?.id;
      const currency = event.resource?.amount?.currency_code;
      const amountValue = event.resource?.amount?.value;

      if (payPalOrderId && payPalCaptureId && currency && amountValue) {
        try {
          await finalizeCreditPurchaseByPayPalOrderId(db, {
            payPalOrderId,
            payPalCaptureId,
            currency,
            amountCents: parsePayPalAmountToCents(amountValue),
            rawCapture: event,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to finalize webhook purchase.';
          console.error('[paypal/webhook finalize]', message);
        }
      }
    }

    if (eventType === 'PAYMENT.CAPTURE.DENIED' && orderId) {
      await markCreditPurchaseOrderStatusByPayPalOrderId(db, {
        payPalOrderId: orderId,
        status: 'denied',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed.';
    console.error('[paypal/webhook]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

