/**
 * Order routing (plan 06): split a paid order by provider, create each provider order, then confirm it.
 * Safe to run more than once: provider_orders has UNIQUE(order_id, provider) and finished steps are skipped.
 */
import { getProvider } from '@/lib/providers';
import { ProviderError, type Recipient } from '@/lib/providers/types';
import type { ProviderId } from '@/lib/types';
import type { PaymentCustomer } from '@/lib/payments/types';
import { uid } from './db';

type Item = { provider: ProviderId; provider_variant_id: string; provider_product_id: string; quantity: number; unit_price: number };

export async function routeOrder(env: Env, orderId: string): Promise<void> {
  const d = env.DB;
  const order = await d.prepare('SELECT id, number, status, shipping_method, shipping_address_json FROM orders WHERE id = ?').bind(orderId).first<{
    id: string;
    number: string;
    status: string;
    shipping_method: 'standard' | 'express';
    shipping_address_json: string;
  }>();
  if (!order) return;
  if (order.status !== 'paid' && order.status !== 'in_production') return; // never route unpaid orders

  const c = JSON.parse(order.shipping_address_json) as PaymentCustomer;
  const recipient: Recipient = {
    name: `${c.firstName} ${c.lastName}`.trim(),
    email: c.email,
    phone: c.phone,
    address1: c.address1,
    address2: c.address2,
    city: c.city,
    region: c.region,
    zip: c.postcode,
    country: c.country,
  };

  const items = (await d.prepare('SELECT provider, provider_variant_id, provider_product_id, quantity, unit_price FROM order_items WHERE order_id = ?').bind(orderId).all<Item>()).results;
  const byProvider = new Map<ProviderId, Item[]>();
  items.forEach((i) => byProvider.set(i.provider, [...(byProvider.get(i.provider) ?? []), i]));

  for (const [providerId, lines] of byProvider) {
    let po = await d.prepare('SELECT id, external_id, status FROM provider_orders WHERE order_id = ? AND provider = ?').bind(orderId, providerId).first<{
      id: string;
      external_id: string | null;
      status: string;
    }>();
    if (!po) {
      const id = uid('po');
      await d.prepare('INSERT INTO provider_orders (id, order_id, provider) VALUES (?, ?, ?)').bind(id, orderId, providerId).run();
      po = { id, external_id: null, status: 'queued' };
    }
    if (po.status === 'in_production' || po.status === 'shipped' || po.status === 'delivered') continue;

    const provider = getProvider(providerId, env);
    try {
      await d.prepare('UPDATE provider_orders SET attempts = attempts + 1 WHERE id = ?').bind(po.id).run();
      if (!po.external_id) {
        const created = await provider.createOrder({
          externalId: `${order.number}-${providerId}`,
          recipient,
          shippingMethod: order.shipping_method,
          lines: lines.map((l) => ({ providerProductId: l.provider_product_id, providerVariantId: l.provider_variant_id, quantity: l.quantity, retailPrice: l.unit_price })),
        });
        po.external_id = created.externalId;
        await d.prepare("UPDATE provider_orders SET external_id = ?, status = 'created', updated_at = datetime('now') WHERE id = ?").bind(created.externalId, po.id).run();
      }
      const confirmed = await provider.confirmOrder(po.external_id);
      await d
        .prepare("UPDATE provider_orders SET status = 'in_production', cost = ?, shipping_cost = ?, last_error = NULL, updated_at = datetime('now') WHERE id = ?")
        .bind(confirmed.cost ?? null, confirmed.shippingCost ?? null, po.id)
        .run();
      await d.prepare("UPDATE order_items SET provider_order_id = ? WHERE order_id = ? AND provider = ?").bind(po.id, orderId, providerId).run();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await d.prepare("UPDATE provider_orders SET last_error = ?, updated_at = datetime('now') WHERE id = ?").bind(msg.slice(0, 1000), po.id).run();
      if (e instanceof ProviderError && !e.retryable) {
        await markNeedsAttention(env, orderId);
        return;
      }
      throw e; // retryable: the queue retries with backoff
    }
  }
  await d.prepare("UPDATE orders SET status = 'in_production', updated_at = datetime('now') WHERE id = ? AND status = 'paid'").bind(orderId).run();
}

export async function markNeedsAttention(env: Env, orderId: string) {
  await env.DB.prepare("UPDATE orders SET status = 'needs_attention', updated_at = datetime('now') WHERE id = ?").bind(orderId).run();
}
