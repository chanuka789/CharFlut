/**
 * Admin read models. Each function reads D1; in local development, when D1 has no orders yet,
 * it returns clearly-labelled sample data so the dashboard design can be reviewed.
 */
import { db } from './db';
import { products } from '@/data/catalog';
import { marginOf } from '@/lib/pricing';
import type { OrderStatus } from '@/lib/types';

export type AdminOrder = {
  id: string;
  number: string;
  email: string;
  status: OrderStatus;
  currency: 'USD' | 'GBP';
  total: number;
  country: string;
  created_at: string;
  items: number;
  providers: string;
};

export type Overview = {
  sample: boolean;
  today: { sales: number; orders: number; aov: number; conversion: number | null };
  series: { date: string; sales: number }[];
  needsAttention: number;
  pending: number;
  topProducts: { title: string; units: number }[];
  byCountry: { country: string; sales: number }[];
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function sampleSeries(days = 30) {
  const out: { date: string; sales: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const base = 18000 + Math.sin(i / 3) * 6000 + (days - i) * 420;
    out.push({ date: dayKey(d), sales: Math.max(0, Math.round(base + ((i * 7919) % 5000))) });
  }
  return out;
}

const SAMPLE_ORDERS: AdminOrder[] = [
  { id: 's1', number: 'CF-482913', email: 'maya@example.com', status: 'needs_attention', currency: 'USD', total: 10498, country: 'US', created_at: '2026-10-05 09:14:00', items: 2, providers: 'printful' },
  { id: 's2', number: 'CF-482877', email: 'tom@example.co.uk', status: 'in_production', currency: 'GBP', total: 5999, country: 'GB', created_at: '2026-10-05 08:02:00', items: 1, providers: 'printify' },
  { id: 's3', number: 'CF-482610', email: 'ana@example.com', status: 'shipped', currency: 'USD', total: 6998, country: 'US', created_at: '2026-10-04 19:41:00', items: 2, providers: 'printful, printify' },
  { id: 's4', number: 'CF-481992', email: 'li@example.com', status: 'delivered', currency: 'USD', total: 3499, country: 'US', created_at: '2026-10-03 13:20:00', items: 1, providers: 'printful' },
  { id: 's5', number: 'CF-481540', email: 'sam@example.co.uk', status: 'paid', currency: 'GBP', total: 8998, country: 'GB', created_at: '2026-10-03 10:05:00', items: 2, providers: 'printify' },
  { id: 's6', number: 'CF-480011', email: 'jo@example.com', status: 'pending_payment', currency: 'USD', total: 3299, country: 'US', created_at: '2026-10-02 22:47:00', items: 1, providers: 'printful' },
];

async function hasOrders(): Promise<boolean> {
  try {
    const r = await db()?.prepare('SELECT COUNT(*) AS n FROM orders').first<{ n: number }>();
    return !!r && r.n > 0;
  } catch {
    return false;
  }
}

const useSample = async () => import.meta.env.DEV && !(await hasOrders());

export async function getOverview(): Promise<Overview> {
  if (await useSample()) {
    const series = sampleSeries();
    return {
      sample: true,
      today: { sales: series[series.length - 1].sales, orders: 14, aov: 4890, conversion: 0.026 },
      series,
      needsAttention: 1,
      pending: 1,
      topProducts: [
        { title: 'CF Monogram Heavy Tee', units: 48 },
        { title: 'CF Monogram Heavy Hoodie', units: 31 },
        { title: 'Sunburst Oversized Tee', units: 27 },
        { title: 'Statement Heavy Tee', units: 19 },
        { title: 'Stacked Logo Hoodie', units: 12 },
      ],
      byCountry: [
        { country: 'United States', sales: 412300 },
        { country: 'United Kingdom', sales: 188900 },
      ],
    };
  }
  const d = db()!;
  const paid = "status IN ('paid','in_production','shipped','delivered')";
  const today = await d
    .prepare(`SELECT COALESCE(SUM(total),0) AS sales, COUNT(*) AS orders FROM orders WHERE ${paid} AND date(created_at) = date('now')`)
    .first<{ sales: number; orders: number }>();
  const series = (
    await d
      .prepare(`SELECT date(created_at) AS date, SUM(total) AS sales FROM orders WHERE ${paid} AND created_at >= date('now','-29 days') GROUP BY date(created_at) ORDER BY date`)
      .all<{ date: string; sales: number }>()
  ).results;
  const filled = sampleSeries().map((s) => ({ date: s.date, sales: series.find((x) => x.date === s.date)?.sales ?? 0 }));
  const counts = await d
    .prepare("SELECT SUM(status='needs_attention') AS na, SUM(status='pending_payment') AS pp FROM orders")
    .first<{ na: number; pp: number }>();
  const top = (
    await d
      .prepare(`SELECT title, SUM(quantity) AS units FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.${paid} GROUP BY title ORDER BY units DESC LIMIT 5`)
      .all<{ title: string; units: number }>()
  ).results;
  const byCountry = (
    await d.prepare(`SELECT country, SUM(total) AS sales FROM orders WHERE ${paid} GROUP BY country`).all<{ country: string; sales: number }>()
  ).results.map((r) => ({ country: r.country === 'GB' ? 'United Kingdom' : 'United States', sales: r.sales }));
  return {
    sample: false,
    today: { sales: today?.sales ?? 0, orders: today?.orders ?? 0, aov: today?.orders ? Math.round(today.sales / today.orders) : 0, conversion: null },
    series: filled,
    needsAttention: counts?.na ?? 0,
    pending: counts?.pp ?? 0,
    topProducts: top,
    byCountry,
  };
}

export async function listOrders(filter: { status?: string; q?: string }): Promise<{ sample: boolean; orders: AdminOrder[] }> {
  if (await useSample()) {
    let list = SAMPLE_ORDERS;
    if (filter.status) list = list.filter((o) => o.status === filter.status);
    if (filter.q) list = list.filter((o) => (o.number + o.email).toLowerCase().includes(filter.q!.toLowerCase()));
    return { sample: true, orders: list };
  }
  const where: string[] = [];
  const binds: unknown[] = [];
  if (filter.status) {
    where.push('o.status = ?');
    binds.push(filter.status);
  }
  if (filter.q) {
    where.push('(o.number LIKE ? OR o.email LIKE ?)');
    binds.push(`%${filter.q}%`, `%${filter.q}%`);
  }
  const rows = await db()!
    .prepare(
      `SELECT o.id, o.number, o.email, o.status, o.currency, o.total, o.country, o.created_at,
        (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS items,
        (SELECT GROUP_CONCAT(DISTINCT provider) FROM order_items WHERE order_id = o.id) AS providers
       FROM orders o ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.created_at DESC LIMIT 100`,
    )
    .bind(...binds)
    .all<AdminOrder>();
  return { sample: false, orders: rows.results };
}

export type AdminOrderDetail = AdminOrder & {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  address: Record<string, string>;
  lines: { title: string; size: string; color_name: string; quantity: number; unit_price: number; provider: string }[];
  providerOrders: { provider: string; external_id: string | null; status: string; attempts: number; last_error: string | null; tracking_url: string | null }[];
  payments: { method: string; reference: string; status: string; status_code: string; amount: number; created_at: string }[];
};

export async function getOrderDetail(number: string): Promise<{ sample: boolean; order: AdminOrderDetail | null }> {
  if (await useSample()) {
    const o = SAMPLE_ORDERS.find((x) => x.number === number) ?? SAMPLE_ORDERS[0];
    return {
      sample: true,
      order: {
        ...o,
        subtotal: o.total - 599,
        discount: 0,
        shipping: 599,
        tax: 0,
        address: { firstName: 'Maya', lastName: 'Lopez', address1: '12 Grand St', city: 'Brooklyn', region: 'NY', postcode: '11211', country: o.country, phone: '+1 555 0100' },
        lines: [
          { title: 'CF Monogram Heavy Tee', size: 'M', color_name: 'Black', quantity: 1, unit_price: 3499, provider: 'printful' },
          { title: 'CF Monogram Heavy Hoodie', size: 'L', color_name: 'Sand', quantity: 1, unit_price: 6999, provider: 'printful' },
        ],
        providerOrders: [{ provider: 'printful', external_id: null, status: 'queued', attempts: 0, last_error: null, tracking_url: null }],
        payments: [{ method: 'webxpay', reference: 'WXP-99231', status: 'approved', status_code: '00', amount: o.total, created_at: o.created_at }],
      },
    };
  }
  const d = db()!;
  const o = await d.prepare('SELECT * FROM orders WHERE number = ?').bind(number).first<AdminOrder & Record<string, unknown>>();
  if (!o) return { sample: false, order: null };
  const lines = (await d.prepare('SELECT title, size, color_name, quantity, unit_price, provider FROM order_items WHERE order_id = ?').bind(o.id).all<AdminOrderDetail['lines'][number]>()).results;
  const providerOrders = (
    await d.prepare('SELECT provider, external_id, status, attempts, last_error, tracking_url FROM provider_orders WHERE order_id = ?').bind(o.id).all<AdminOrderDetail['providerOrders'][number]>()
  ).results;
  const payments = (
    await d.prepare('SELECT method, reference, status, status_code, amount, created_at FROM payments WHERE order_id = ? ORDER BY created_at').bind(o.id).all<AdminOrderDetail['payments'][number]>()
  ).results;
  return {
    sample: false,
    order: {
      ...(o as unknown as AdminOrder),
      subtotal: o.subtotal as number,
      discount: o.discount as number,
      shipping: o.shipping as number,
      tax: o.tax as number,
      items: lines.reduce((n, l) => n + l.quantity, 0),
      providers: [...new Set(lines.map((l) => l.provider))].join(', '),
      address: JSON.parse(String(o.shipping_address_json)),
      lines,
      providerOrders,
      payments,
    },
  };
}

/** Product list for the admin: the launch catalogue plus margin per product (cost from the provider sync). */
export function adminProducts() {
  // Placeholder provider costs (USD cents) until the sync fills variants.cost_usd.
  const cost = (cat: string, fit: string) => (cat === 'hoodies' ? (fit === 'oversized' ? 2650 : 2250) : fit === 'oversized' ? 1390 : 1150);
  return products.map((p) => {
    const c = cost(p.category, p.fit);
    return { ...p, cost: c, margin: marginOf(p.price.USD, c + 450) };
  });
}
