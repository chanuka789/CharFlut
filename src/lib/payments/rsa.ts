/**
 * Minimal RSA with PKCS#1 v1.5 padding, using BigInt.
 * Needed because WebXPay uses PHP openssl_public_encrypt / openssl_public_decrypt (PKCS#1 v1.5),
 * which Web Crypto does not offer (it only has RSA-OAEP for encryption and hashed signatures).
 * Only the PUBLIC key is ever used here.
 */

export type RsaPublicKey = { n: bigint; e: bigint; size: number };

const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64.replace(/\s+/g, '')), (c) => c.charCodeAt(0));
export const bytesToB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

function bytesToBigInt(b: Uint8Array): bigint {
  let hex = '';
  for (const x of b) hex += x.toString(16).padStart(2, '0');
  return hex ? BigInt('0x' + hex) : 0n;
}
function bigIntToBytes(n: bigint, len: number): Uint8Array {
  let hex = n.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const raw = Uint8Array.from(hex.match(/../g) ?? [], (h) => parseInt(h, 16));
  if (raw.length > len) throw new Error('RSA: integer too large');
  const out = new Uint8Array(len);
  out.set(raw, len - raw.length);
  return out;
}
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

/* ---- Tiny DER reader for SubjectPublicKeyInfo / RSAPublicKey ---- */
function readTLV(buf: Uint8Array, pos: number) {
  const tag = buf[pos];
  let len = buf[pos + 1];
  let off = pos + 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    len = 0;
    for (let i = 0; i < n; i++) len = (len << 8) | buf[off + i];
    off += n;
  }
  return { tag, start: off, end: off + len };
}

/** Accepts "-----BEGIN PUBLIC KEY-----" (SPKI) or "-----BEGIN RSA PUBLIC KEY-----" (PKCS#1) PEM. */
export function parsePublicKeyPem(pem: string): RsaPublicKey {
  const isPkcs1 = pem.includes('RSA PUBLIC KEY');
  const der = b64ToBytes(pem.replace(/-----[^-]+-----/g, ''));
  let seq = readTLV(der, 0); // outer SEQUENCE
  let p = seq.start;
  if (!isPkcs1) {
    const algo = readTLV(der, p); // AlgorithmIdentifier
    p = algo.end;
    const bitStr = readTLV(der, p); // BIT STRING
    p = bitStr.start + 1; // skip "unused bits" byte
    seq = readTLV(der, p); // RSAPublicKey SEQUENCE
    p = seq.start;
  }
  const nT = readTLV(der, p);
  const eT = readTLV(der, nT.end);
  let nBytes = der.slice(nT.start, nT.end);
  while (nBytes[0] === 0) nBytes = nBytes.slice(1);
  return { n: bytesToBigInt(nBytes), e: bytesToBigInt(der.slice(eT.start, eT.end)), size: nBytes.length };
}

/** RSAES-PKCS1-v1_5 encrypt (type 2 padding). Same output format as PHP openssl_public_encrypt. */
export function encryptPkcs1v15(key: RsaPublicKey, message: Uint8Array): Uint8Array {
  const k = key.size;
  if (message.length > k - 11) throw new Error('RSA: message too long');
  const ps = new Uint8Array(k - 3 - message.length);
  crypto.getRandomValues(ps);
  for (let i = 0; i < ps.length; i++) while (ps[i] === 0) ps[i] = crypto.getRandomValues(new Uint8Array(1))[0];
  const em = new Uint8Array(k);
  em[0] = 0;
  em[1] = 2;
  em.set(ps, 2);
  em[2 + ps.length] = 0;
  em.set(message, 3 + ps.length);
  return bigIntToBytes(modPow(bytesToBigInt(em), key.e, key.n), k);
}

/**
 * "Public decrypt" (type 1 padding) — what PHP openssl_public_decrypt does to check a signature
 * made with the private key. Returns the recovered bytes, or null if the padding is invalid.
 */
export function publicDecryptPkcs1v15(key: RsaPublicKey, signature: Uint8Array): Uint8Array | null {
  const k = key.size;
  if (signature.length !== k) return null;
  const s = bytesToBigInt(signature);
  if (s >= key.n) return null;
  const em = bigIntToBytes(modPow(s, key.e, key.n), k);
  if (em[0] !== 0 || em[1] !== 1) return null;
  let i = 2;
  while (i < k && em[i] === 0xff) i++;
  if (i - 2 < 8 || em[i] !== 0) return null;
  return em.slice(i + 1);
}
