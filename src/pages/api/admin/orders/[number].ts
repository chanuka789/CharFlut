/** Admin order actions. Access identity is verified in middleware; every action is written to the audit log. */
import type { APIRoute } from 'astro';
import { audit, db, getEnv } from '@/lib/server/db';
import { queueRouting } from '@/lib/server/orders';
import { getProvider } from '@/lib/providers';
import type { ProviderId } from '@/lib/types';

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const staff = locals.staff!;
  const action = String((await request.formData()).get('action') ?? '');
  const d = db();
  const back = (q: string) => redirect(`/admin/orders/${params.number}?${q}`, 303);
  if (!d) return back('error=Database%20not%20available');
  const o = await d.prepare('SELECT id, status FROM orders WHERE number = ?').bind(params.number).first<{ id: string; status: string }>();
  if (!o) return back('error=Order%20not%20found');

  if (action === 'approve') {
    if (o.status !== 'needs_attention') return back('error=Only%20orders%20that%20need%20attention%20can%20be%20approved');
    await d.prepare("UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE id = ?").bind(o.id).run();
    await queueRouting(o.id);
  } else if (action === 'resend') {
    await queueRouting(o.id);
  } else if (action === 'refunded') {
    if (staff.role === 'support') return back('error=Only%20owners%20and%20managers%20can%20mark%20refunds');
    await d.prepare("UPDATE orders SET status = 'refunded', updated_at = datetime('now') WHERE id = ?").bind(o.id).run();
  } else if (action === 'cancel') {
    if (staff.role === 'support') return back('error=Only%20owners%20and%20managers%20can%20cancel');
    const pos = (await d.prepare("SELECT provider, external_id FROM provider_orders WHERE order_id = ? AND external_id IS NOT NULL AND status IN ('created','queued')").bind(o.id).all<{ provider: ProviderId; external_id: string }>()).results;
    for (const p of pos) {
      try {
        await getProvider(p.provider, getEnv()).cancelOrder(p.external_id);
      } catch {
        /* surfaced on the provider row */
      }
    }
    await d.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").bind(o.id).run();
  } else {
    return back('error=Unknown%20action');
  }
  await audit(staff.email, `order.${action}`, 'order', o.id, { from: o.status });
  return back(`done=${action}`);
};
