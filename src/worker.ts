/**
 * Worker entry: Astro handles HTTP; this file adds the Queue consumer (order routing with retries)
 * and the nightly Cron (product sync + order status check). See plan 06 and 08.
 */
import { handle } from '@astrojs/cloudflare/handler';
import { routeOrder, markNeedsAttention } from '@/lib/server/routing';
import { syncAllProducts } from '@/lib/server/sync';

type OrderMessage = { type: 'route-order'; orderId: string };

export default {
  fetch: handle,

  async queue(batch: MessageBatch<OrderMessage>, env: Env) {
    for (const msg of batch.messages) {
      try {
        if (msg.body.type === 'route-order') await routeOrder(env, msg.body.orderId);
        msg.ack();
      } catch (e) {
        console.error('route-order failed', msg.body.orderId, (e as Error).message);
        if (msg.attempts >= 3) {
          await markNeedsAttention(env, msg.body.orderId);
          msg.ack();
        } else {
          // Growing delays: 30 s, 2 min, 8 min
          msg.retry({ delaySeconds: 30 * 4 ** (msg.attempts - 1) });
        }
      }
    }
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(syncAllProducts(env).catch((e) => console.error('nightly sync failed', e)));
  },
} satisfies ExportedHandler<Env, OrderMessage>;
