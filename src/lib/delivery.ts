/**
 * Delivery estimate (plan 04, Product #3): production days + shipping days for the visitor's country,
 * skipping weekends. Real numbers come from the provider shipping-rates API at checkout.
 */
export const DELIVERY = {
  production: [2, 5],
  shipping: {
    US: { standard: [3, 6], express: [2, 3] },
    GB: { standard: [2, 4], express: [1, 2] },
  },
} as const;

export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

export function estimate(country: string, method: 'standard' | 'express' = 'standard', now = new Date()) {
  const zone = country === 'GB' ? DELIVERY.shipping.GB : DELIVERY.shipping.US;
  const [s1, s2] = zone[method];
  const [p1, p2] = DELIVERY.production;
  const fmt = new Intl.DateTimeFormat(country === 'GB' ? 'en-GB' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return {
    from: fmt.format(addWorkingDays(now, p1 + s1)),
    to: fmt.format(addWorkingDays(now, p2 + s2)),
    region: country === 'GB' ? 'the UK' : 'the US',
  };
}
