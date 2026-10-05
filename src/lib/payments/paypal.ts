/**
 * PayPal Checkout (plan 07: "later", when PayPal Checkout opens for Sri Lankan sellers).
 * Orders API v2: create order on the server, buyer approves in PayPal, server captures.
 * Webhooks: PAYMENT.CAPTURE.COMPLETED / REFUNDED, verified with /v1/notifications/verify-webhook-signature.
 * Disabled until PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set.
 */
import { toDecimal } from './types';
import type { Currency } from '@/lib/types';

type Cfg = { clientId: string; clientSecret: string; env: 'sandbox' | 'live' };
const base = (env: Cfg['env']) => (env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

async function token(cfg: Cfg): Promise<string> {
  const res = await fetch(`${base(cfg.env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${cfg.clientId}:${cfg.clientSecret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export async function createPayPalOrder(cfg: Cfg, order: { id: string; number: string; total: number; currency: Currency }) {
  const res = await fetch(`${base(cfg.env)}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token(cfg)}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': order.id },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ reference_id: order.id, custom_id: order.id, invoice_id: order.number, amount: { currency_code: order.currency, value: toDecimal(order.total) } }],
    }),
  });
  if (!res.ok) throw new Error(`PayPal create ${res.status}`);
  return (await res.json()) as { id: string; status: string };
}

export async function capturePayPalOrder(cfg: Cfg, paypalOrderId: string) {
  const res = await fetch(`${base(cfg.env)}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token(cfg)}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': `cap-${paypalOrderId}` },
  });
  if (!res.ok) throw new Error(`PayPal capture ${res.status}`);
  const body = (await res.json()) as {
    status: string;
    purchase_units: { custom_id?: string; payments: { captures: { id: string; status: string; amount: { value: string; currency_code: Currency } }[] } }[];
  };
  const cap = body.purchase_units[0]?.payments.captures[0];
  return {
    ok: body.status === 'COMPLETED' && cap?.status === 'COMPLETED',
    orderId: body.purchase_units[0]?.custom_id ?? '',
    captureId: cap?.id ?? '',
    amount: cap ? Math.round(parseFloat(cap.amount.value) * 100) : 0,
    currency: cap?.amount.currency_code,
  };
}

export async function verifyPayPalWebhook(cfg: Cfg & { webhookId: string }, headers: Headers, rawBody: string): Promise<boolean> {
  const res = await fetch(`${base(cfg.env)}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token(cfg)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: cfg.webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  if (!res.ok) return false;
  return ((await res.json()) as { verification_status: string }).verification_status === 'SUCCESS';
}

export function paypalConfig(env: Env): Cfg | null {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) return null;
  return { clientId: env.PAYPAL_CLIENT_ID, clientSecret: env.PAYPAL_CLIENT_SECRET, env: env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox' };
}
