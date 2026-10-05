import type { AstroGlobal } from 'astro';
import { currentCustomer, type Customer } from './auth';
import { db } from './db';
import type { OrderStatus } from '@/lib/types';

/** Local development shows the account pages with a demo customer so the design can be reviewed without D1 data. */
const DEMO: Customer = { id: 'demo', email: 'you@example.com', name: 'Demo Customer', marketing_consent: 1 };

export async function requireCustomer(Astro: AstroGlobal): Promise<Customer | Response> {
  let c: Customer | null = null;
  try {
    c = await currentCustomer(Astro.cookies);
  } catch {
    c = null; // tables missing (migrations not applied yet)
  }
  if (c) return c;
  if (import.meta.env.DEV) return DEMO;
  return Astro.redirect('/account/sign-in', 303);
}

export type OrderRow = { number: string; status: OrderStatus; created_at: string; total: number; currency: 'USD' | 'GBP'; items: number };

export async function customerOrders(customer: Customer): Promise<OrderRow[]> {
  if (customer.id === 'demo') {
    return [
      { number: 'CF-482913', status: 'shipped', created_at: '2026-09-29 10:12:00', total: 10498, currency: 'USD', items: 2 },
      { number: 'CF-377104', status: 'delivered', created_at: '2026-08-14 18:40:00', total: 3499, currency: 'USD', items: 1 },
    ];
  }
  const d = db();
  if (!d) return [];
  return (
    await d
      .prepare(
        `SELECT o.number, o.status, o.created_at, o.total, o.currency, (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS items
         FROM orders o WHERE o.customer_id = ? AND o.status != 'pending_payment' ORDER BY o.created_at DESC LIMIT 50`,
      )
      .bind(customer.id)
      .all<OrderRow>()
  ).results;
}
