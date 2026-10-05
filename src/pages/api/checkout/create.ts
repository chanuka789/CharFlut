import type { APIRoute } from 'astro';
import { orderNumber, priceCart, type CheckoutLineInput } from '@/lib/server/checkout';
import { getEnv, json } from '@/lib/server/db';
import { createPendingOrder } from '@/lib/server/orders';
import { validateCustomer } from '@/lib/server/validate';
import { buildWebXPayForm } from '@/lib/payments/webxpay';

/**
 * Pay step (plan 07, WebXPay flow steps 1–2): re-price on the server, create the order as pending_payment,
 * and return the encrypted form the browser posts to WebXPay.
 */
export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    lines?: CheckoutLineInput[];
    customer?: Record<string, unknown>;
    shippingMethod?: 'standard' | 'express';
    discountCode?: string;
    acceptTerms?: boolean;
  };
  const { customer, errors } = validateCustomer(body.customer ?? {});
  if (!customer) return json({ error: 'Please check the highlighted fields.', fields: errors }, { status: 422 });
  if (!body.acceptTerms) return json({ error: 'Please accept the terms to continue.', fields: { acceptTerms: 'Required' } }, { status: 422 });

  const currency = customer.country === 'GB' ? 'GBP' : 'USD';
  const method = body.shippingMethod === 'express' ? 'express' : 'standard';
  const quote = priceCart(body.lines ?? [], currency, { shippingMethod: method, discountCode: body.discountCode, country: customer.country });
  if (!quote.lines.length) return json({ error: 'Your cart is empty.' }, { status: 422 });
  if (quote.errors.length) return json({ error: quote.errors[0], quote }, { status: 409 });

  const env = getEnv();
  if (!env.WEBXPAY_SECRET_KEY || !env.WEBXPAY_PUBLIC_KEY) {
    return json({ error: 'Card payments are not switched on yet. Please try again soon.' }, { status: 503 });
  }

  const order = await createPendingOrder(quote, customer, method, orderNumber());
  const form = buildWebXPayForm(
    { baseUrl: env.WEBXPAY_BASE_URL, secretKey: env.WEBXPAY_SECRET_KEY, publicKeyPem: env.WEBXPAY_PUBLIC_KEY },
    { id: order.id, number: order.number, total: quote.total, currency },
    customer,
  );
  return json({ order: { number: order.number }, payment: form });
};
