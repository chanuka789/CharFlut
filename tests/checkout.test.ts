import { describe, expect, it } from 'vitest';
import { priceCart } from '@/lib/server/checkout';
import { validateCustomer } from '@/lib/server/validate';

const hoodie = { productId: 'p_07', colorId: 'black', size: 'L', quantity: 1 };
const tee = { productId: 'p_01', colorId: 'white', size: 'M', quantity: 1 };

describe('server-side cart pricing', () => {
  it('prices from the catalogue, not the browser', () => {
    const q = priceCart([{ ...hoodie, unitPrice: 1 } as never], 'USD');
    expect(q.subtotal).toBe(6999);
    expect(q.total).toBe(6999); // free US shipping over $60, no sales tax yet
  });
  it('charges shipping under the free threshold', () => {
    const q = priceCart([tee], 'USD');
    expect(q.shipping).toBe(599);
    expect(q.total).toBe(3499 + 599);
  });
  it('applies WELCOME10 and keeps UK VAT inside the total', () => {
    const q = priceCart([hoodie], 'GBP', { discountCode: 'welcome10' });
    expect(q.discount).toBe(600);
    expect(q.shipping).toBe(0);
    expect(q.taxIncluded).toBe(true);
    expect(q.total).toBe(5399);
  });
  it('rejects unknown products, sizes, colours and silly quantities', () => {
    const q = priceCart(
      [
        { productId: 'nope', colorId: 'black', size: 'M', quantity: 1 },
        { productId: 'p_01', colorId: 'pink', size: 'M', quantity: 1 },
        { productId: 'p_01', colorId: 'black', size: '5XL', quantity: 1 },
        { productId: 'p_01', colorId: 'black', size: 'M', quantity: 99 },
      ],
      'USD',
    );
    expect(q.lines).toHaveLength(0);
    expect(q.errors).toHaveLength(4);
  });
  it('flags an invalid discount code', () => {
    expect(priceCart([tee], 'USD', { discountCode: 'FREE100' }).errors[0]).toMatch(/not valid/);
  });
  it('splits lines by provider for routing', () => {
    const q = priceCart([hoodie, { productId: 'p_03', colorId: 'black', size: 'M', quantity: 2 }], 'USD');
    expect(new Set(q.lines.map((l) => l.provider))).toEqual(new Set(['printful', 'printify']));
  });
});

describe('checkout validation', () => {
  const base = { firstName: 'A', lastName: 'B', email: 'a@b.com', phone: '+1 555 0100', address1: '1 St', city: 'NYC' };
  it('accepts a US address with state and ZIP', () => {
    expect(validateCustomer({ ...base, region: 'NY', postcode: '10001', country: 'US' }).customer).toBeTruthy();
  });
  it('accepts a UK postcode', () => {
    expect(validateCustomer({ ...base, postcode: 'sw1a 1aa', country: 'GB' }).customer?.postcode).toBe('SW1A 1AA');
  });
  it('rejects bad email and ZIP', () => {
    const r = validateCustomer({ ...base, email: 'nope', region: 'NY', postcode: '123', country: 'US' });
    expect(r.errors.email).toBeTruthy();
    expect(r.errors.postcode).toBeTruthy();
  });
});
