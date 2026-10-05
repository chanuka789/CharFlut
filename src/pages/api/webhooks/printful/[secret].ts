/**
 * Printful webhooks (plan 06): order_created, order_updated, order_failed, order_cancelled,
 * shipment_sent, shipment_delivered, catalog_price_changed, catalog_stock_updated.
 * Configure with POST https://api.printful.com/v2/webhooks, URL https://<site>/api/webhooks/printful/<WEBHOOK_SECRET_PATH>.
 */
import type { APIRoute } from 'astro';
import { getEnv, json } from '@/lib/server/db';
import { applyProviderOrder, markProcessed, recordEvent, secretMatches } from '@/lib/server/webhooks';
import { getProvider } from '@/lib/providers';
import { syncAllProducts } from '@/lib/server/sync';

type Event = { type: string; created?: number; occurred_at?: string; data?: { order?: { id: number }; shipment?: { order_id?: number } } };

export const POST: APIRoute = async ({ params, request, locals }) => {
  const env = getEnv();
  if (!secretMatches(params.secret, env.WEBHOOK_SECRET_PATH)) return new Response('Not found', { status: 404 });
  const raw = await request.text();
  let evt: Event;
  try {
    evt = JSON.parse(raw);
  } catch {
    return json({ ok: false }, { status: 400 });
  }
  const orderId = evt.data?.order?.id ?? evt.data?.shipment?.order_id;
  const eventId = `${evt.type}:${orderId ?? ''}:${evt.created ?? evt.occurred_at ?? ''}`;
  if (!(await recordEvent(env.DB, 'printful', eventId, evt.type, evt))) return json({ ok: true, duplicate: true });

  const work = async () => {
    try {
      if (orderId) {
        const order = await getProvider('printful', env).getOrder(String(orderId)); // re-fetch
        await applyProviderOrder(env.DB, 'printful', String(orderId), order);
      } else if (evt.type === 'catalog_price_changed' || evt.type === 'catalog_stock_updated') {
        // Re-sync costs and stock; the admin overview flags products whose margin falls below the rule.
        await syncAllProducts(env);
      }
      await markProcessed(env.DB, 'printful', eventId);
    } catch (e) {
      await markProcessed(env.DB, 'printful', eventId, (e as Error).message);
    }
  };
  locals.cfContext.waitUntil(work());
  return json({ ok: true });
};
