/**
 * Printify webhooks (plan 06): product:publish:started, product:updated, product:deleted,
 * order:sent-to-production, order:shipment:created, order:shipment:delivered, order:updated.
 * Register with POST /v1/shops/{shop_id}/webhooks.json using https://<site>/api/webhooks/printify/<WEBHOOK_SECRET_PATH>.
 */
import type { APIRoute } from 'astro';
import { getEnv, json } from '@/lib/server/db';
import { applyProviderOrder, markProcessed, recordEvent, secretMatches } from '@/lib/server/webhooks';
import { getProvider } from '@/lib/providers';
import { reportPublishSucceeded } from '@/lib/providers/printify';
import { upsertProduct } from '@/lib/server/sync';

type Event = { id: string; type: string; resource: { id: string; type: string; data?: unknown } };

export const POST: APIRoute = async ({ params, request, locals }) => {
  const env = getEnv();
  if (!secretMatches(params.secret, env.WEBHOOK_SECRET_PATH)) return new Response('Not found', { status: 404 });
  const evt = (await request.json().catch(() => null)) as Event | null;
  if (!evt?.id || !evt.type) return json({ ok: false }, { status: 400 });
  if (!(await recordEvent(env.DB, 'printify', evt.id, evt.type, evt))) return json({ ok: true, duplicate: true });

  const work = async () => {
    try {
      const provider = getProvider('printify', env);
      if (evt.type.startsWith('product:')) {
        if (evt.type === 'product:deleted') {
          await env.DB.prepare("UPDATE products SET status = 'hidden' WHERE provider = 'printify' AND provider_product_id = ?").bind(evt.resource.id).run();
        } else {
          const product = await provider.getProduct(evt.resource.id); // re-fetch, do not trust the body
          await upsertProduct(env, product);
          if (evt.type === 'product:publish:started') {
            await reportPublishSucceeded(env.PRINTIFY_API_TOKEN!, env.PRINTIFY_SHOP_ID!, evt.resource.id, `${env.SITE_URL}/shop`);
          }
        }
      } else if (evt.type.startsWith('order:')) {
        const order = await provider.getOrder(evt.resource.id);
        await applyProviderOrder(env.DB, 'printify', evt.resource.id, order);
      }
      await markProcessed(env.DB, 'printify', evt.id);
    } catch (e) {
      await markProcessed(env.DB, 'printify', evt.id, (e as Error).message);
    }
  };
  // Answer fast; finish the work in the background.
  locals.cfContext.waitUntil(work());
  return json({ ok: true });
};
