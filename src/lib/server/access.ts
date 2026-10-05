/**
 * Cloudflare Access check for /admin (CLAUDE.md security rules: "Check the Access identity in the API as well").
 * Verifies the Cf-Access-Jwt-Assertion header (RS256) against the team's public keys and the app's AUD tag.
 */
import { env } from 'cloudflare:workers';

type Identity = { email: string; role: 'owner' | 'manager' | 'support' };
type Jwk = JsonWebKey & { kid: string };

let keyCache: { at: number; keys: Jwk[] } | null = null;

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function getKeys(teamDomain: string): Promise<Jwk[]> {
  if (keyCache && Date.now() - keyCache.at < 3600_000) return keyCache.keys;
  const res = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access certs ${res.status}`);
  const body = (await res.json()) as { keys: Jwk[] };
  keyCache = { at: Date.now(), keys: body.keys };
  return body.keys;
}

function roleFor(email: string, e: Record<string, unknown>): Identity['role'] {
  const list = (name: string) =>
    String(e[name] ?? '')
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  const lower = email.toLowerCase();
  if (list('ADMIN_OWNERS').includes(lower)) return 'owner';
  if (list('ADMIN_MANAGERS').includes(lower)) return 'manager';
  return 'support';
}

export async function verifyAccessJwt(request: Request): Promise<Identity | null> {
  const e = env as unknown as Record<string, string | undefined>;
  // Local development only: wrangler/astro dev has no Access in front of it.
  if (import.meta.env.DEV) return { email: 'dev@localhost', role: 'owner' };

  const token = request.headers.get('cf-access-jwt-assertion');
  const team = e.ACCESS_TEAM_DOMAIN;
  const aud = e.ACCESS_AUD;
  if (!token || !team || !aud) return null;

  try {
    const [h, p, s] = token.split('.');
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h))) as { kid: string; alg: string };
    if (header.alg !== 'RS256') return null;
    const jwk = (await getKeys(team)).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      b64urlToBytes(s) as BufferSource,
      new TextEncoder().encode(`${h}.${p}`),
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p))) as {
      aud: string | string[];
      exp: number;
      email?: string;
      iss: string;
    };
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(aud)) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    if (payload.iss !== team) return null;
    if (!payload.email) return null;
    return { email: payload.email, role: roleFor(payload.email, e) };
  } catch {
    return null;
  }
}
