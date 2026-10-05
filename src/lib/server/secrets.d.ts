/**
 * Worker secrets (set with `npx wrangler secret put <NAME>`, or in .dev.vars locally).
 * Never read these in browser code.
 */
interface CharFlutSecrets {
  PRINTIFY_API_TOKEN?: string;
  PRINTIFY_SHOP_ID?: string;
  PRINTFUL_API_TOKEN?: string;
  PRINTFUL_STORE_ID?: string;
  WEBXPAY_SECRET_KEY?: string;
  WEBXPAY_PUBLIC_KEY?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_ID?: string;
  PAYPAL_ENV?: 'sandbox' | 'live';
  WEBHOOK_SECRET_PATH?: string;
  EMAIL_API_KEY?: string;
  EMAIL_FROM?: string;
  SESSION_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  ACCESS_AUD?: string;
  ADMIN_OWNERS?: string;
  ADMIN_MANAGERS?: string;
}

declare namespace Cloudflare {
  interface Env extends CharFlutSecrets {}
}
interface Env extends CharFlutSecrets {}
