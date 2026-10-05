import type { APIRoute } from 'astro';
import { db, getEnv, json, uid } from '@/lib/server/db';

/** Contact form -> support ticket in the admin inbox (plan 04, Contact; plan 05, Support inbox). Turnstile-protected. */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const fd = await request.formData();
  const field = (k: string, max = 200) => String(fd.get(k) ?? '').trim().slice(0, max);
  const email = field('email', 160);
  const message = field('message', 4000);
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Enter a valid email address.';
  if (message.length < 10) errors.message = 'Tell us a little more (at least 10 characters).';
  if (Object.keys(errors).length) return json({ error: 'Please check the form.', fields: errors }, { status: 422 });

  const env = getEnv();
  if (env.TURNSTILE_SECRET_KEY) {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: field('cf-turnstile-response', 2048), remoteip: clientAddress }),
    });
    const out = (await res.json()) as { success: boolean };
    if (!out.success) return json({ error: 'Please complete the check and try again.' }, { status: 400 });
  }

  await db()
    ?.prepare('INSERT INTO tickets (id, email, name, topic, order_number, message) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(uid('tkt'), email, field('name', 80), field('topic', 40), field('order', 20), message)
    .run();
  return json({ message: 'Thanks. We reply within one working day.' });
};
