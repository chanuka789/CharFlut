/**
 * Provider adapter (plan 06). The store talks only to this interface; Printify and Printful live behind it.
 * Adding a third provider = one new module that implements PrintProvider.
 */
import type { ProviderId } from '@/lib/types';

export type Recipient = {
  name: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  region?: string; // US state code or UK county
  zip: string;
  country: 'US' | 'GB';
};

export type ProviderLine = {
  providerProductId: string;
  providerVariantId: string;
  quantity: number;
  /** Retail price per unit in minor units, used on packing slips / customs */
  retailPrice?: number;
  sku?: string;
};

export type ShippingRate = {
  id: string; // provider rate id, e.g. "STANDARD"
  method: 'standard' | 'express';
  name: string;
  /** USD cents */
  cost: number;
  minDays?: number;
  maxDays?: number;
};

export type SyncedVariant = {
  providerVariantId: string;
  sku?: string;
  size: string;
  colorName: string;
  colorHex?: string;
  /** Provider cost in USD cents */
  cost: number;
  inStock: boolean;
};

export type SyncedProduct = {
  provider: ProviderId;
  providerProductId: string;
  title: string;
  description?: string;
  tags: string[];
  images: { src: string; variantIds?: string[]; position?: string }[];
  variants: SyncedVariant[];
};

export type ProviderOrderStatus = 'created' | 'in_production' | 'shipped' | 'delivered' | 'failed' | 'cancelled';

export type ProviderOrder = {
  externalId: string;
  status: ProviderOrderStatus;
  cost?: number;
  shippingCost?: number;
  shipments: { carrier?: string; trackingNumber?: string; trackingUrl?: string }[];
};

export interface PrintProvider {
  readonly id: ProviderId;
  listProducts(): Promise<SyncedProduct[]>;
  getProduct(providerProductId: string): Promise<SyncedProduct>;
  getShippingRates(recipient: Recipient, lines: ProviderLine[]): Promise<ShippingRate[]>;
  /** Creates the order as a draft / on hold. Use the CharFlut order id as external_id for idempotency. */
  createOrder(input: { externalId: string; recipient: Recipient; lines: ProviderLine[]; shippingMethod: 'standard' | 'express' }): Promise<ProviderOrder>;
  /** Sends the draft to production (only after payment is confirmed). */
  confirmOrder(externalId: string): Promise<ProviderOrder>;
  getOrder(externalId: string): Promise<ProviderOrder>;
  cancelOrder(externalId: string): Promise<void>;
}

export class ProviderError extends Error {
  constructor(
    public provider: ProviderId,
    public status: number,
    message: string,
    public retryable: boolean,
  ) {
    super(`[${provider}] ${status}: ${message}`);
  }
}

/** fetch with timeout and a typed error. Retries are handled by the order queue, not here. */
export async function providerFetch<T>(provider: ProviderId, url: string, init: RequestInit & { timeoutMs?: number }): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 15_000);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      throw new ProviderError(provider, res.status, text.slice(0, 500), retryable);
    }
    return (text ? JSON.parse(text) : {}) as T;
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    throw new ProviderError(provider, 0, (e as Error).message, true);
  } finally {
    clearTimeout(timer);
  }
}
