/**
 * Transactional email (plan 08: Resend or Postmark). Uses Resend's HTTP API when EMAIL_API_KEY is set;
 * otherwise logs, so local development works without an email account.
 */
import { getEnv } from './db';

export async function sendEmail(msg: { to: string; subject: string; html: string }) {
  const env = getEnv();
  if (!env.EMAIL_API_KEY) {
    console.log(`[email:dev] to=${msg.to} subject="${msg.subject}"`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM ?? 'CharFlut <hello@charflut.com>', to: [msg.to], subject: msg.subject, html: msg.html }),
  });
  if (!res.ok) console.error('email send failed', res.status);
}
