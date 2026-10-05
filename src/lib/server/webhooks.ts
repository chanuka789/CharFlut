/**
 * Webhook helpers (CLAUDE.md security rules): secret URL path, store each event once, and re-fetch the object
 * from the provider API before acting. Never trust the webhook body for prices or status.
 */
import { uid } from './db';

export function secretMatches(given: string | undefined, expected: string | undefined): boolean {
  if (!given || !expected || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Returns false if this event was already stored (idempotency). */
export async function recordEvent(d: D1Database, provider: string, eventId: string, type: string, payload: unknown): Promise<boolean> {
  const res = await d
    .prepare('INSERT INTO webhook_events (id, provider, event_id, type, payload_json) VALUES (?, ?, ?, ?, ?) ON CONFLICT (provider, event_id) DO NOTHING')
    .bind(uid('evt'), provider, eventId, type, JSON.stringify(payload).slice(0, 100_000))
    .run();
  return (res.meta.changes ?? 0) > 0;
}

export async function markProcessed(d: D1Database, provider: string, eventId: string, error?: string) {
  await d
    .prepare("UPDATE webhook_events SET processed_at = datetime('now'), error = ? WHERE provider = ? AND event_id = ?")
    .bind(error ?? null, provider, eventId)
    .run();
}

/** Copies provider order status + tracking into provider_orders and rolls the overall order status forward. */
export async function applyProviderOrder(
  d: D1Database,
  provider: string,
  externalId: string,
  o: { status: string; shipments: { carrier?: string; trackingNumber?: string; trackingUrl?: string }[] },
) {
  const s = o.shipments[0];
  await d
    .prepare(
      `UPDATE provider_orders SET status = ?, carrier = COALESCE(?, carrier), tracking_number = COALESCE(?, tracking_number),
       tracking_url = COALESCE(?, tracking_url), updated_at = datetime('now') WHERE provider = ? AND external_id = ?`,
    )
    .bind(o.status, s?.carrier ?? null, s?.trackingNumber ?? null, s?.trackingUrl ?? null, provider, externalId)
    .run();
  const po = await d.prepare('SELECT order_id FROM provider_orders WHERE provider = ? AND external_id = ?').bind(provider, externalId).first<{ order_id: string }>();
  if (!po) return;
  const all = (await d.prepare('SELECT status FROM provider_orders WHERE order_id = ?').bind(po.order_id).all<{ status: string }>()).results.map((r) => r.status);
  const next = all.some((x) => x === 'failed')
    ? 'needs_attention'
    : all.every((x) => x === 'delivered')
      ? 'delivered'
      : all.every((x) => x === 'shipped' || x === 'delivered')
        ? 'shipped'
        : null;
  if (next) await d.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(next, po.order_id).run();
  // TODO(phase 3 emails): send "shipped" email with tracking link when next === 'shipped'.
}
