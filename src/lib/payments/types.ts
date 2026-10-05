/** Payment adapter (plan 07). Each method is a module behind this interface. */
import type { Currency } from '@/lib/types';

export type PaymentMethodId = 'webxpay' | 'paypal';

export type PaymentCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  region?: string;
  postcode: string;
  country: 'US' | 'GB';
};

/** What the browser needs to start a payment. */
export type PaymentStart =
  | { kind: 'redirect-form'; action: string; fields: Record<string, string> }
  | { kind: 'redirect'; url: string }
  | { kind: 'client'; data: Record<string, string> };

export type PaymentResult = {
  ok: boolean;
  orderId: string;
  /** Amount confirmed by the gateway, in minor units, or null if the gateway does not echo it */
  amount: number | null;
  currency?: Currency;
  reference: string;
  statusCode: string;
  message?: string;
  raw: Record<string, string>;
};

export const toDecimal = (minor: number) => (minor / 100).toFixed(2);
