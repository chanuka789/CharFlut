import type { APIRoute } from 'astro';
import { db, json } from '@/lib/server/db';

/** Newsletter and waitlist sign-ups. Works as a plain form post (redirects back) or via fetch (JSON). */
export const POST: APIRoute = async ({ request, redirect }) => {
  const fd = await request.formData();
  const email = String(fd.get('email') ?? '').trim().toLowerCase().slice(0, 160);
  const source = String(fd.get('source') ?? 'site').slice(0, 40);
  const wantsJson = request.headers.get('accept')?.includes('application/json');
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  if (ok) {
    await db()
      ?.prepare('INSERT INTO subscribers (email, source) VALUES (?, ?) ON CONFLICT(email) DO NOTHING')
      .bind(email, source)
      .run();
    // TODO(phase 3): send double opt-in email with the WELCOME10 code through the email service.
  }
  const message = ok ? 'You are on the list. Check your inbox for your 10% code.' : 'Please enter a valid email address.';
  if (wantsJson) return json({ message }, { status: ok ? 200 : 422 });
  return redirect(`${new URL(request.headers.get('referer') ?? '/', request.url).pathname}?subscribed=${ok ? 1 : 0}`, 303);
};
