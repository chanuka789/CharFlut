import { defineMiddleware } from 'astro:middleware';
import type { Currency } from '@/lib/types';
import { verifyAccessJwt } from '@/lib/server/access';

/**
 * 1. Currency: cookie first, else from the visitor's country (Cloudflare sets cf-ipcountry). GB -> GBP, else USD.
 * 2. Admin: /admin and /api/admin require a valid Cloudflare Access identity (checked again here, not only at the edge).
 * 3. Security headers on every HTML response.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, url, locals } = context;

  const cookieCur = cookies.get('cf_currency')?.value;
  const country = request.headers.get('cf-ipcountry') ?? 'US';
  const currency: Currency = cookieCur === 'GBP' || cookieCur === 'USD' ? cookieCur : country === 'GB' ? 'GBP' : 'USD';
  locals.currency = currency;
  locals.country = country;

  const isAdmin = url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin');
  if (isAdmin) {
    const identity = await verifyAccessJwt(request);
    if (!identity) {
      return new Response('Not authorised. The admin is protected by Cloudflare Access.', { status: 403 });
    }
    locals.staff = identity;
  }

  const response = await next();

  const type = response.headers.get('content-type') ?? '';
  if (type.includes('text/html')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (isAdmin) response.headers.set('Cache-Control', 'no-store');
  }
  return response;
});
