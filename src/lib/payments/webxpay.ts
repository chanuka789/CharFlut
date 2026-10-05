/**
 * WebXPay card payments (plan 07). Redirect flow: the browser posts a form to WebXPay, the customer pays there,
 * and WebXPay posts back `payment` + `signature` to /checkout/result.
 *
 * Field names and the response layout follow WebXPay's PHP integration kit. CONFIRM WITH WEBXPAY IN WRITING
 * before going live (plan 07, open points): field list, enc_method value, RSA padding, GBP support.
 */
import { bytesToB64, encryptPkcs1v15, parsePublicKeyPem, publicDecryptPkcs1v15 } from './rsa';
import { toDecimal, type PaymentCustomer, type PaymentResult, type PaymentStart } from './types';
import type { Currency } from '@/lib/types';

export type WebXPayConfig = {
  baseUrl: string;
  secretKey: string;
  publicKeyPem: string;
};

/** Builds the auto-submitting form the browser posts to WebXPay. */
export function buildWebXPayForm(
  cfg: WebXPayConfig,
  order: { id: string; number: string; total: number; currency: Currency },
  customer: PaymentCustomer,
): PaymentStart {
  const key = parsePublicKeyPem(cfg.publicKeyPem);
  const plain = new TextEncoder().encode(`${order.id}|${toDecimal(order.total)}`);
  const payment = bytesToB64(encryptPkcs1v15(key, plain));
  // custom_fields: base64 of pipe-separated values, echoed back by WebXPay.
  const custom = btoa(`${order.number}|${order.currency}|${toDecimal(order.total)}|charflut`);

  return {
    kind: 'redirect-form',
    action: cfg.baseUrl,
    fields: {
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      contact_number: customer.phone,
      address_line_one: customer.address1,
      address_line_two: customer.address2 ?? '',
      city: customer.city,
      state: customer.region ?? '',
      postal_code: customer.postcode,
      country: customer.country === 'GB' ? 'United Kingdom' : 'United States',
      process_currency: order.currency,
      cms: 'Custom',
      custom_fields: custom,
      enc_method: 'JCs3J+6oSz4V0LgE0zi/Bg==',
      secret_key: cfg.secretKey,
      payment,
    },
  };
}

/**
 * Verifies the signed response. `payment` and `signature` are base64. The signature is the payment string
 * encrypted with WebXPay's private key, so decrypting it with their public key must give back `payment`.
 * Decoded payment: order_id|order_reference_number|date_time_transaction|payment_gateway_used|status_code|comment
 */
export function verifyWebXPayResponse(cfg: Pick<WebXPayConfig, 'publicKeyPem'>, body: { payment?: string; signature?: string; custom_fields?: string }): PaymentResult | null {
  if (!body.payment || !body.signature) return null;
  let paymentBytes: Uint8Array, sigBytes: Uint8Array;
  try {
    paymentBytes = Uint8Array.from(atob(body.payment), (c) => c.charCodeAt(0));
    sigBytes = Uint8Array.from(atob(body.signature), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  const key = parsePublicKeyPem(cfg.publicKeyPem);
  const recovered = publicDecryptPkcs1v15(key, sigBytes);
  if (!recovered || !equalBytes(recovered, paymentBytes)) return null;

  const decoded = new TextDecoder().decode(paymentBytes);
  const [orderId, reference, dateTime, gateway, statusCode, comment] = decoded.split('|');
  let customAmount: number | null = null;
  let customCurrency: Currency | undefined;
  try {
    const [, cur, amt] = atob(body.custom_fields ?? '').split('|');
    if (amt) customAmount = Math.round(parseFloat(amt) * 100);
    if (cur === 'USD' || cur === 'GBP') customCurrency = cur;
  } catch {
    /* custom fields are optional */
  }
  return {
    ok: statusCode === '0' || statusCode === '00',
    orderId,
    amount: customAmount,
    currency: customCurrency,
    reference,
    statusCode,
    message: comment,
    raw: { orderId, reference, dateTime, gateway, statusCode, comment },
  };
}

function equalBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
