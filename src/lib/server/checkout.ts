/**
 * Server-side cart pricing (CLAUDE.md: never trust amounts from the browser).
 * The browser sends only product ids, colour, size and quantity; everything else is looked up here.
 */
import { products } from '@/data/catalog';
import { FLAT_SHIPPING, FREE_SHIPPING, vatIncluded } from '@/lib/money';
import type { Currency, ProviderId, Size } from '@/lib/types';

export type CheckoutLineInput = { productId: string; colorId: string; size: string; quantity: number };

export type PricedLine = {
  productId: string;
  title: string;
  colorId: string;
  colorName: string;
  size: Size;
  quantity: number;
  unitPrice: number;
  provider: ProviderId;
  providerProductId: string;
  providerVariantId: string;
};

export type Quote = {
  currency: Currency;
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  taxIncluded: boolean;
  total: number;
  discountCode?: string;
  errors: string[];
};

export type DiscountRule = { code: string; kind: 'percent' | 'fixed' | 'free_shipping'; value: number; minSubtotal?: number };

/** Launch codes until the admin Discounts module (phase 2) is live. */
const LAUNCH_DISCOUNTS: DiscountRule[] = [{ code: 'WELCOME10', kind: 'percent', value: 10 }];

export function priceCart(
  input: CheckoutLineInput[],
  currency: Currency,
  opts: { shippingMethod?: 'standard' | 'express'; discountCode?: string; country?: 'US' | 'GB'; providerShipping?: number } = {},
): Quote {
  const errors: string[] = [];
  const lines: PricedLine[] = [];

  for (const l of input.slice(0, 50)) {
    const p = products.find((x) => x.id === l.productId && x.status === 'active');
    const color = p?.colors.find((c) => c.id === l.colorId);
    const size = p?.sizes.find((s) => s === l.size);
    const qty = Math.floor(Number(l.quantity));
    if (!p || !color || !size || !(qty >= 1 && qty <= 10)) {
      errors.push(`An item in your cart is no longer available (${l.productId}).`);
      continue;
    }
    lines.push({
      productId: p.id,
      title: p.title,
      colorId: color.id,
      colorName: color.name,
      size,
      quantity: qty,
      unitPrice: p.price[currency],
      provider: p.provider,
      // Placeholder ids until the D1 sync fills real provider ids (plan 06, "Product sync").
      providerProductId: `${p.provider}:${p.id}`,
      providerVariantId: `${p.provider}:${p.id}:${color.id}:${size}`,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  let discount = 0;
  let freeShipFromCode = false;
  let discountCode: string | undefined;
  if (opts.discountCode) {
    const rule = LAUNCH_DISCOUNTS.find((d) => d.code.toLowerCase() === opts.discountCode!.trim().toLowerCase());
    if (!rule) errors.push('That discount code is not valid.');
    else if (rule.minSubtotal && subtotal < rule.minSubtotal) errors.push('Your cart is below the minimum for that code.');
    else {
      discountCode = rule.code;
      if (rule.kind === 'percent') discount = Math.round((subtotal * rule.value) / 100);
      if (rule.kind === 'fixed') discount = Math.min(subtotal, rule.value);
      if (rule.kind === 'free_shipping') freeShipFromCode = true;
    }
  }

  const method = opts.shippingMethod ?? 'standard';
  const afterDiscount = subtotal - discount;
  const qualifiesFree = method === 'standard' && (afterDiscount >= FREE_SHIPPING[currency] || freeShipFromCode);
  const shipping = lines.length === 0 || qualifiesFree ? 0 : FLAT_SHIPPING[currency][method];

  // UK: prices are VAT-inclusive (shown for information). US: sales tax is added per state when registered (plan 09).
  const taxIncluded = currency === 'GBP';
  const tax = taxIncluded ? vatIncluded(afterDiscount + shipping) : 0;
  const total = afterDiscount + shipping + (taxIncluded ? 0 : tax);

  return { currency, lines, subtotal, discount, shipping, tax, taxIncluded, total, discountCode, errors };
}

export function orderNumber(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 900000;
  return `CF-${100000 + n}`;
}
