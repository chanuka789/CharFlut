import { describe, expect, it } from 'vitest';
import { formatMoney, vatIncluded } from '@/lib/money';
import { autoPrice, marginOf, roundTo99 } from '@/lib/pricing';

describe('money', () => {
  it('formats per currency', () => {
    expect(formatMoney(3499, 'USD')).toBe('$34.99');
    expect(formatMoney(2999, 'GBP')).toBe('£29.99');
    expect(formatMoney(6000, 'USD')).toBe('$60');
  });
  it('extracts UK VAT from a VAT-inclusive price', () => {
    expect(vatIncluded(6000)).toBe(1000);
    expect(vatIncluded(5399)).toBe(900);
  });
});

describe('pricing rules', () => {
  it('rounds up to .99', () => {
    expect(roundTo99(3312)).toBe(3399);
    expect(roundTo99(3399)).toBe(3399);
    expect(roundTo99(3400)).toBe(3499);
  });
  it('auto-prices from cost, shipping share, fee and margin', () => {
    const price = autoPrice({ cost: 1390, shippingShare: 450, targetMargin: 0.45 });
    expect(price % 100).toBe(99);
    expect(marginOf(price, 1390, 0.0485, 450)).toBeGreaterThanOrEqual(0.45);
  });
  it('refuses impossible margins', () => {
    expect(() => autoPrice({ cost: 1000, targetMargin: 0.96 })).toThrow();
  });
});
