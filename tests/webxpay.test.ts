import { generateKeyPairSync, privateDecrypt, privateEncrypt, constants } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { encryptPkcs1v15, parsePublicKeyPem } from '@/lib/payments/rsa';
import { buildWebXPayForm, verifyWebXPayResponse } from '@/lib/payments/webxpay';

// Stand-in for WebXPay's key pair: we hold the private key only in this test.
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const pemPkcs1 = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString();

const sign = (s: string) => privateEncrypt({ key: privateKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(s)).toString('base64');

describe('RSA PKCS#1 v1.5 (matches PHP openssl_public_encrypt)', () => {
  it('parses SPKI and PKCS#1 PEMs to the same key', () => {
    const a = parsePublicKeyPem(pem);
    const b = parsePublicKeyPem(pemPkcs1);
    expect(a.n).toBe(b.n);
    expect(a.e).toBe(65537n);
    expect(a.size).toBe(256);
  });
  it('encrypts so the private key holder can decrypt', () => {
    const ct = encryptPkcs1v15(parsePublicKeyPem(pem), new TextEncoder().encode('ord_123|34.99'));
    const pt = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(ct)).toString();
    expect(pt).toBe('ord_123|34.99');
  });
});

describe('WebXPay form', () => {
  it('builds an encrypted payment field and never includes card data', () => {
    const start = buildWebXPayForm(
      { baseUrl: 'https://stagingxpay.info/x', secretKey: 'sk', publicKeyPem: pem },
      { id: 'ord_1', number: 'CF-100001', total: 3499, currency: 'USD' },
      { firstName: 'A', lastName: 'B', email: 'a@b.com', phone: '1', address1: '1', city: 'c', postcode: '10001', country: 'US', region: 'NY' },
    );
    if (start.kind !== 'redirect-form') throw new Error('expected form');
    const pt = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(start.fields.payment, 'base64')).toString();
    expect(pt).toBe('ord_1|34.99');
    expect(start.fields.process_currency).toBe('USD');
  });
});

describe('WebXPay response signature', () => {
  const payment = 'ord_1|REF77|2026-10-05 10:00:00|visa|00|Approved';
  const body = { payment: Buffer.from(payment).toString('base64'), signature: sign(payment) };

  it('accepts a correctly signed approval', () => {
    const r = verifyWebXPayResponse({ publicKeyPem: pem }, body)!;
    expect(r.ok).toBe(true);
    expect(r.orderId).toBe('ord_1');
    expect(r.reference).toBe('REF77');
  });
  it('rejects a tampered payment string', () => {
    const forged = Buffer.from(payment.replace('|00|', '|00|').replace('ord_1', 'ord_2')).toString('base64');
    expect(verifyWebXPayResponse({ publicKeyPem: pem }, { ...body, payment: forged })).toBeNull();
  });
  it('rejects a signature made with another key', () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    const sig = privateEncrypt({ key: other, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(payment)).toString('base64');
    expect(verifyWebXPayResponse({ publicKeyPem: pem }, { ...body, signature: sig })).toBeNull();
  });
  it('treats non-00 status codes as declined', () => {
    const declined = 'ord_1|REF78|2026-10-05 10:00:00|visa|05|Declined';
    const r = verifyWebXPayResponse({ publicKeyPem: pem }, { payment: Buffer.from(declined).toString('base64'), signature: sign(declined) })!;
    expect(r.ok).toBe(false);
  });
  it('does not treat the unsigned custom_fields amount as proof', () => {
    const r = verifyWebXPayResponse({ publicKeyPem: pem }, { ...body, custom_fields: btoa('CF-1|USD|0.01|charflut') })!;
    // The amount is echoed for display only; orders.applyPaymentResult holds the order unless amountVerified is true.
    expect(r.amount).toBe(1);
  });
});
