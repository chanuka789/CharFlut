import type { APIRoute } from 'astro';
import { priceCart, type CheckoutLineInput } from '@/lib/server/checkout';
import { json } from '@/lib/server/db';

/** Server-priced totals for the checkout summary. The browser never decides the price. */
export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await request.json().catch(() => ({}))) as {
    lines?: CheckoutLineInput[];
    country?: 'US' | 'GB';
    shippingMethod?: 'standard' | 'express';
    discountCode?: string;
  };
  if (!Array.isArray(body.lines)) return json({ error: 'Invalid cart' }, { status: 400 });
  const country = body.country === 'GB' ? 'GB' : body.country === 'US' ? 'US' : locals.country === 'GB' ? 'GB' : 'US';
  // Currency follows the shipping country: USD for the US, GBP for the UK.
  const currency = country === 'GB' ? 'GBP' : 'USD';
  const quote = priceCart(body.lines, currency, { shippingMethod: body.shippingMethod, discountCode: body.discountCode, country });
  return json(quote);
};
