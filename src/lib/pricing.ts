/**
 * Pricing rules (plan 05, "Pricing rules"): price = (provider cost + shipping share + payment fee) / (1 - target margin),
 * rounded up to .99. All values are integer minor units.
 */
export type PricingInput = {
  /** Provider base cost for the variant, minor units */
  cost: number;
  /** Shipping cost the store absorbs per unit, minor units */
  shippingShare?: number;
  /** Payment fee as a fraction of the sale price, e.g. 0.0485 for WebXPay foreign cards */
  paymentFeeRate?: number;
  /** Target gross margin as a fraction of the sale price, e.g. 0.45 */
  targetMargin: number;
};

export function autoPrice({ cost, shippingShare = 0, paymentFeeRate = 0.0485, targetMargin }: PricingInput): number {
  if (targetMargin + paymentFeeRate >= 1) throw new Error('Margin plus fee must be under 100%');
  const raw = (cost + shippingShare) / (1 - targetMargin - paymentFeeRate);
  return roundTo99(raw);
}

/** Round up to the next x.99 (e.g. 3312 -> 3399, 3399 -> 3399). */
export function roundTo99(minor: number): number {
  const whole = Math.ceil((minor + 1) / 100);
  return whole * 100 - 1;
}

export function marginOf(price: number, cost: number, paymentFeeRate = 0.0485, shippingShare = 0): number {
  if (price <= 0) return 0;
  return (price - cost - shippingShare - price * paymentFeeRate) / price;
}
