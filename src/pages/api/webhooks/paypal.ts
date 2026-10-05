/** PayPal webhooks (phase 2). Verified through PayPal's verify-webhook-signature API before anything happens. */
import type { APIRoute } from 'astro';
import { getEnv, json } from '@/lib/server/db';
import { paypalConfig, verifyPayPalWebhook } from '@/lib/payments/paypal';
import { markProcessed, recordEvent } from '@/lib/server/webhooks';

export const POST: APIRoute = async ({ request }) => {
  const env = getEnv();
  const cfg = paypalConfig(env);
  if (!cfg || !env.PAYPAL_WEBHOOK_ID) return new Response('Not found', { status: 404 });
  const raw = await request.text();
  if (!(await verifyPayPalWebhook({ ...cfg, webhookId: env.PAYPAL_WEBHOOK_ID }, request.headers, raw))) return json({ ok: false }, { status: 400 });
  const evt = JSON.parse(raw) as { id: string; event_type: string };
  if (!(await recordEvent(env.DB, 'paypal', evt.id, evt.event_type, evt))) return json({ ok: true, duplicate: true });
  // Phase 2: captures are confirmed by the capture endpoint added with PayPal; here we only record refunds and reversals.
  await markProcessed(env.DB, 'paypal', evt.id);
  return json({ ok: true });
};
