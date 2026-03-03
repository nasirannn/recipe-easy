type PayPalTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

type PayPalApiError = {
  name?: string;
  message?: string;
  details?: unknown;
};

function resolvePayPalMode(): 'sandbox' | 'live' {
  const mode = (process.env.PAYPAL_MODE || process.env.NEXT_PUBLIC_PAYPAL_MODE || 'sandbox')
    .trim()
    .toLowerCase();
  return mode === 'live' ? 'live' : 'sandbox';
}

function getPayPalApiBase(): string {
  return resolvePayPalMode() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function getPayPalCredentials(): { clientId: string; clientSecret: string } {
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured.');
  }

  return { clientId, clientSecret };
}

async function parseJsonSafe(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function requestPayPalAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getPayPalCredentials();
  const base = getPayPalApiBase();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  const data = (await parseJsonSafe(response)) as PayPalTokenResponse | PayPalApiError;
  if (!response.ok || !data || typeof (data as PayPalTokenResponse).access_token !== 'string') {
    const message = (data as PayPalApiError)?.message || 'Failed to get PayPal access token.';
    throw new Error(message);
  }

  return (data as PayPalTokenResponse).access_token as string;
}

async function paypalRequest<T>(
  path: string,
  options: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {}
): Promise<T> {
  const accessToken = await requestPayPalAccessToken();
  const base = getPayPalApiBase();

  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    cache: 'no-store',
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message = data?.message || data?.name || 'PayPal request failed.';
    throw new Error(message);
  }

  return data as T;
}

export type CreatePayPalOrderPayload = {
  intent: 'CAPTURE';
  purchase_units: Array<{
    reference_id?: string;
    custom_id?: string;
    description?: string;
    amount: {
      currency_code: string;
      value: string;
    };
  }>;
  application_context?: {
    brand_name?: string;
    landing_page?: 'LOGIN' | 'BILLING';
    shipping_preference?: string;
    user_action?: string;
    return_url?: string;
    cancel_url?: string;
    locale?: string;
  };
};

export type CreatePayPalOrderResponse = {
  id?: string;
  status?: string;
  links?: Array<{ href?: string; rel?: string; method?: string }>;
};

export async function createPayPalOrder(
  payload: CreatePayPalOrderPayload
): Promise<CreatePayPalOrderResponse> {
  return paypalRequest<CreatePayPalOrderResponse>('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type CapturePayPalOrderResponse = {
  id?: string;
  status?: string;
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
};

export async function capturePayPalOrder(orderId: string): Promise<CapturePayPalOrderResponse> {
  return paypalRequest<CapturePayPalOrderResponse>(`/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    body: '{}',
  });
}

export type VerifyPayPalWebhookPayload = {
  auth_algo: string;
  cert_url: string;
  transmission_id: string;
  transmission_sig: string;
  transmission_time: string;
  webhook_id: string;
  webhook_event: Record<string, unknown>;
};

export async function verifyPayPalWebhookSignature(
  payload: VerifyPayPalWebhookPayload
): Promise<boolean> {
  const result = await paypalRequest<{ verification_status?: string }>(
    '/v1/notifications/verify-webhook-signature',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return result?.verification_status === 'SUCCESS';
}

export function getPayPalWebhookId(): string {
  return (process.env.PAYPAL_WEBHOOK_ID || '').trim();
}

export function parsePayPalAmountToCents(value: string | number | undefined | null): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.round(parsed * 100);
}
