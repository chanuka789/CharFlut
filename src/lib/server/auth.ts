/**
 * Customer sign-in with magic links (plan 04, Account): a one-time link by email, then a signed session cookie.
 * Tokens are stored hashed; links expire after 20 minutes and work once.
 */
import type { AstroCookies } from 'astro';
import { db, getEnv, uid } from './db';
import { sendEmail } from './email';

const COOKIE = 'cf_session';

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function requestMagicLink(email: string, origin: string) {
  const d = db();
  if (!d) return;
  const token = crypto.randomUUID() + crypto.randomUUID();
  await d
    .prepare("INSERT INTO magic_links (token_hash, email, expires_at) VALUES (?, ?, datetime('now', '+20 minutes'))")
    .bind(await sha256(token), email.toLowerCase())
    .run();
  const link = `${origin}/account/verify?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Your CharFlut sign-in link',
    html: `<p>Tap the button to sign in to CharFlut. The link works once and expires in 20 minutes.</p>
           <p><a href="${link}" style="display:inline-block;background:#FFC800;color:#111;padding:14px 22px;border-radius:8px;font-weight:800;text-decoration:none">Sign in</a></p>
           <p>If you did not ask for this, you can ignore this email.</p>`,
  });
}

export async function consumeMagicLink(token: string, cookies: AstroCookies): Promise<boolean> {
  const d = db();
  if (!d || !token) return false;
  const hash = await sha256(token);
  const row = await d
    .prepare("SELECT email FROM magic_links WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')")
    .bind(hash)
    .first<{ email: string }>();
  if (!row) return false;
  await d.prepare("UPDATE magic_links SET used_at = datetime('now') WHERE token_hash = ?").bind(hash).run();

  let customer = await d.prepare('SELECT id FROM customers WHERE email = ?').bind(row.email).first<{ id: string }>();
  if (!customer) {
    customer = { id: uid('cus') };
    await d.prepare('INSERT INTO customers (id, email) VALUES (?, ?)').bind(customer.id, row.email).run();
  }
  // Link guest orders placed with this email
  await d.prepare('UPDATE orders SET customer_id = ? WHERE email = ? AND customer_id IS NULL').bind(customer.id, row.email).run();

  const sid = crypto.randomUUID();
  await d.prepare("INSERT INTO sessions (id, customer_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").bind(await sha256(sid), customer.id).run();
  cookies.set(COOKIE, sid, { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
  return true;
}

export type Customer = { id: string; email: string; name: string | null; marketing_consent: number };

export async function currentCustomer(cookies: AstroCookies): Promise<Customer | null> {
  const sid = cookies.get(COOKIE)?.value;
  const d = db();
  if (!sid || !d) return null;
  return d
    .prepare(
      `SELECT c.id, c.email, c.name, c.marketing_consent FROM sessions s JOIN customers c ON c.id = s.customer_id
       WHERE s.id = ? AND s.expires_at > datetime('now')`,
    )
    .bind(await sha256(sid))
    .first<Customer>();
}

export async function signOut(cookies: AstroCookies) {
  const sid = cookies.get(COOKIE)?.value;
  if (sid) await db()?.prepare('DELETE FROM sessions WHERE id = ?').bind(await sha256(sid)).run();
  cookies.delete(COOKIE, { path: '/' });
}

export const hasAuthBackend = () => !!getEnv().DB;
