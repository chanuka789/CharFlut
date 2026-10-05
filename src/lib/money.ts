import type { Currency } from './types';

const LOCALE: Record<Currency, string> = { USD: 'en-US', GBP: 'en-GB' };

/** Format integer minor units: formatMoney(3499, 'USD') -> "$34.99" */
export function formatMoney(minor: number, currency: Currency): string {
  return new Intl.NumberFormat(LOCALE[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);
}

export const FREE_SHIPPING: Record<Currency, number> = { USD: 6000, GBP: 5000 };

/** Default shipping when no provider quote is available yet (shown as an estimate only). */
export const FLAT_SHIPPING: Record<Currency, { standard: number; express: number }> = {
  USD: { standard: 599, express: 1499 },
  GBP: { standard: 499, express: 1199 },
};

/** UK VAT is charged on goods sent to UK consumers (plan 09). Prices are shown VAT-inclusive in GBP. */
export const UK_VAT_RATE = 0.2;

export function vatIncluded(grossMinor: number, rate = UK_VAT_RATE): number {
  return Math.round(grossMinor - grossMinor / (1 + rate));
}

export function sumMinor(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
