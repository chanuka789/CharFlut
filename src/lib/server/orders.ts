/**
 * Orders: create (pending_payment), confirm payment, route to providers, guest lookup.
 * Routing rule (plan 06): only after payment is confirmed; one provider order per provider.
 */
import { db, uid, getEnv } from './db';
import type { Quote } from './checkout';
import type { PaymentCustomer, PaymentResult } from '@/lib/payments/types';
import type { OrderStatus } from '@/lib/types';

export type OrderView = {
  number: string;
  status: OrderStatus;
  createdAt: string;
  currency: 'USD' | 'GBP';
  total: number;
  items: { title: string; size: string; colorName: string; quantity: number }[];
  shipments: { provider: string; status: string; carrier?: string; trackingUrl?: string }[];
};

export async function createPendingOrder(quote: Quote, customer: PaymentCustomer, shippingMethod: 'standard' | 'express', number: string) {
  const d = db();
  const id = uid('ord');
  if (!d) return { id, number }; // no D1 bound (local preview): order is not persisted
  const address = JSON.stringify(customer);
  const stmts = [
    d
      .prepare(
        `INSERT INTO orders (id, number, email, currency, subtotal, discount, shipping, tax, total, discount_code, shipping_method,
          shipping_address_json, status, payment_method, country, region)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', 'webxpay', ?, ?)`,
      )
      .bind(
        id,
        number,
        customer.email,
        quote.currency,
        quote.subtotal,
        quote.discount,
        quote.shipping,
        quote.tax,
        quote.total,
        quote.discountCode ?? null,
        shippingMethod,
        address,
        customer.country,
        customer.region ?? null,
      ),
    ...quote.lines.map((l) =>
      d
        .prepare(
          `INSERT INTO order_items (id, order_id, product_id, variant_id, title, size, color_name, quantity, unit_price, provider, provider_product_id, provider_variant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(uid('itm'), id, l.productId, l.providerVariantId, l.title, l.size, l.colorName, l.quantity, l.unitPrice, l.provider, l.providerProductId, l.providerVariantId),
    ),
  ];
  await d.batch(stmts);
  return { id, number };
}

/**
 * Applies a verified gateway result. Idempotent: a repeat callback for the same reference does nothing twice.
 * If the gateway did not confirm the amount, the order is held for an admin check instead of being routed.
 */
export async function applyPaymentResult(result: PaymentResult, method: 'webxpay' | 'paypal', opts: { amountVerified: boolean }) {
  const d = db();
  if (!d) return { status: result.ok ? 'paid' : 'declined', number: '' };
  const order = await d.prepare('SELECT id, number, total, currency, status FROM orders WHERE id = ?').bind(result.orderId).first<{
    id: string;
    number: string;
    total: number;
    currency: string;
    status: OrderStatus;
  }>();
  if (!order) return { status: 'unknown_order', number: '' };

  const existing = await d.prepare('SELECT id FROM payments WHERE method = ? AND reference = ?').bind(method, result.reference).first();
  if (existing) return { status: order.status, number: order.number };

  const amountMatches = result.amount === null ? null : result.amount === order.total && (!result.currency || result.currency === order.currency);
  await d
    .prepare('INSERT INTO payments (id, order_id, method, reference, status_code, status, amount, currency, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(uid('pay'), order.id, method, result.reference, result.statusCode, result.ok ? 'approved' : 'declined', result.amount ?? order.total, order.currency, JSON.stringify(result.raw))
    .run();

  if (!result.ok) return { status: 'declined', number: order.number };
  if (order.status !== 'pending_payment') return { status: order.status, number: order.number };

  // Mark paid only when the amount is proven. Otherwise hold for a manual check (plan 07 money rules).
  const proven = opts.amountVerified && amountMatches === true;
  const next: OrderStatus = proven ? 'paid' : 'needs_attention';
  await d
    .prepare("UPDATE orders SET status = ?, payment_ref = ?, paid_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND status = 'pending_payment'")
    .bind(next, result.reference, order.id)
    .run();

  if (next === 'paid') await queueRouting(order.id);
  return { status: next, number: order.number };
}

/** Puts the order on the queue; the consumer in src/worker.ts creates and confirms the provider orders. */
export async function queueRouting(orderId: string) {
  const env = getEnv();
  await env.ORDER_QUEUE?.send({ type: 'route-order', orderId });
}

export async function findOrderForGuest(number: string, email: string): Promise<OrderView | null> {
  const d = db();
  if (!d || !number || !email) return null;
  const o = await d
    .prepare('SELECT id, number, status, created_at, currency, total FROM orders WHERE number = ? AND email = ? COLLATE NOCASE')
    .bind(number.toUpperCase(), email)
    .first<{ id: string; number: string; status: OrderStatus; created_at: string; currency: 'USD' | 'GBP'; total: number }>();
  if (!o) return null;
  const items = await d.prepare('SELECT title, size, color_name as colorName, quantity FROM order_items WHERE order_id = ?').bind(o.id).all<OrderView['items'][number]>();
  const ships = await d
    .prepare('SELECT provider, status, carrier, tracking_url as trackingUrl FROM provider_orders WHERE order_id = ?')
    .bind(o.id)
    .all<OrderView['shipments'][number]>();
  return { number: o.number, status: o.status, createdAt: o.created_at, currency: o.currency, total: o.total, items: items.results, shipments: ships.results };
}
