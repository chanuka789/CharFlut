# Connect CharFlut to Cloudflare

Follow these steps in order. Commands run in the project folder. You need a Cloudflare account, Node 22+, and the domain (charflut.com is assumed; change `SITE_URL` in `wrangler.jsonc` and `site` in `astro.config.mjs` if yours differs).

## 1. Log in and choose a plan

```bash
npx wrangler login
```

Upgrade to **Workers Paid ($5/month)** in Dashboard → Workers & Pages → Plans. The free plan's 10 ms CPU limit is too tight for checkout signing and provider sync, and Queues need the paid plan (check Cloudflare's current plan limits).

## 2. Add the domain

1. Dashboard → **Add a domain** → enter `charflut.com` → Free plan is fine for the zone.
2. At your registrar, replace the nameservers with the two Cloudflare shows. Wait until the domain says **Active**.
3. SSL/TLS → Overview → **Full (strict)**. Edge Certificates → turn on **Always Use HTTPS**.

## 3. Create the resources

Production:

```bash
npx wrangler d1 create charflut-db
npx wrangler r2 bucket create charflut-media
npx wrangler kv namespace create SESSION
npx wrangler queues create charflut-orders
npx wrangler queues create charflut-orders-dlq
```

Staging (optional but recommended):

```bash
npx wrangler d1 create charflut-db-staging
npx wrangler r2 bucket create charflut-media-staging
npx wrangler kv namespace create SESSION_STAGING
npx wrangler queues create charflut-orders-staging
```

Copy each printed ID into `wrangler.jsonc`, replacing every `REPLACE_WITH_...` value (D1 `database_id`, KV `id`). Then regenerate types:

```bash
npm run cf-typegen
```

## 4. Create the database tables

```bash
npm run db:migrate:remote
```

(For staging add `--env staging`: `npx wrangler d1 migrations apply charflut-db-staging --remote --env staging`.)

## 5. Add secrets

Each command asks for the value; it is stored encrypted on Cloudflare and never in git. Add only what you have; the site shows "not set up" for the rest.

```bash
npx wrangler secret put PRINTIFY_API_TOKEN
```

Repeat for each name:

| Secret | Where to get it |
| --- | --- |
| `PRINTIFY_API_TOKEN`, `PRINTIFY_SHOP_ID` | Printify → My profile → Connections → API (scopes: shops, catalog, products, orders, uploads, webhooks). Shop ID: `GET /v1/shops.json` |
| `PRINTFUL_API_TOKEN` (`PRINTFUL_STORE_ID` if needed) | Printful → Developers → Your tokens (store type: Manual order platform / API) |
| `WEBXPAY_SECRET_KEY`, `WEBXPAY_PUBLIC_KEY` | WebXPay merchant portal (paste the full PEM public key) |
| `WEBHOOK_SECRET_PATH` | Make one: `node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"` |
| `EMAIL_API_KEY`, `EMAIL_FROM` | Resend → API keys; verify the domain in Resend first |
| `TURNSTILE_SECRET_KEY` | Step 9 |
| `ACCESS_AUD`, `ADMIN_OWNERS`, `ADMIN_MANAGERS` | Step 7 (owners/managers are comma-separated emails) |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV` | Phase 2 only |

Local development uses `.dev.vars` (copy `.dev.vars.example`; it is git-ignored).

## 6. First deploy

```bash
npm run deploy
```

This builds Astro (which writes `dist/server/wrangler.json`) and runs `wrangler deploy`. The Worker includes the website, the API, the order queue consumer and the 03:00 UTC nightly sync.

Then attach the domain: Workers & Pages → **charflut** → Settings → **Domains & Routes** → Add → Custom domain → `charflut.com`, and again for `www.charflut.com` (or add a redirect rule from www to the apex).

Staging: `CLOUDFLARE_ENV=staging npm run build` then `npx wrangler deploy`, and attach `staging.charflut.com`.

## 7. Protect the admin with Cloudflare Access

1. Dashboard → **Zero Trust** (pick a team name; Free covers up to 50 users).
2. Settings → Authentication → add a login method (One-time PIN by email is simplest; Google also works).
3. Access → Applications → **Add an application** → Self-hosted:
   - Domain `charflut.com`, path `admin`; add a second destination with path `api/admin`.
   - Policy: **Allow**, Include → Emails → your staff emails.
4. Open the application → copy the **Application Audience (AUD) tag** → `npx wrangler secret put ACCESS_AUD`.
5. In `wrangler.jsonc` set `ACCESS_TEAM_DOMAIN` to `https://<your-team>.cloudflareaccess.com`, then deploy again.

The Worker checks the Access token again on every admin request, so the admin stays closed even if the Access app is misconfigured.

## 8. Connect the providers' webhooks

Use your `WEBHOOK_SECRET_PATH` value in place of `<secret>`.

- **Printify:** `POST https://api.printify.com/v1/shops/{shop_id}/webhooks.json` with `{"topic":"order:updated","url":"https://charflut.com/api/webhooks/printify/<secret>"}` — repeat for `product:publish:started`, `product:updated`, `product:deleted`, `order:sent-to-production`, `order:shipment:created`, `order:shipment:delivered`.
- **Printful:** `POST https://api.printful.com/v2/webhooks` with the URL `https://charflut.com/api/webhooks/printful/<secret>` and the events `order_created`, `order_updated`, `order_failed`, `order_canceled`, `shipment_sent`, `shipment_delivered`, `catalog_price_changed`, `catalog_stock_updated` (check the v2 docs for exact event names, as v2 is in beta).
- Then Admin → Providers → **Sync now**, and check "Recent webhook events".

## 9. Turnstile, analytics, email routing

- **Turnstile:** Dashboard → Turnstile → Add site (`charflut.com`) → put the secret in `TURNSTILE_SECRET_KEY`, and the site key in a `PUBLIC_TURNSTILE_SITE_KEY` build variable (Workers Builds → Variables, or `.env` locally).
- **Web Analytics:** Dashboard → Analytics & Logs → Web Analytics → add the site (cookie-free, no consent banner needed).
- **Email Routing:** Email → Email Routing → create `hello@`, `privacy@`, `accessibility@` and forward them to your inbox (free).

## 10. Automatic deploys from GitHub

Workers & Pages → charflut → Settings → **Builds** → Connect your GitHub repository.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`; enable preview builds for other branches if you want preview URLs.
- Add the same `PUBLIC_*` build variables here.

## 11. Security settings

- Security → WAF → **Rate limiting rules**: e.g. 20 requests per minute per IP on `/api/checkout/*`, `/account/sign-in`, `/api/contact`, `/api/newsletter`.
- Security → Bots → turn on **Bot Fight Mode**.
- Keep `observability` on (already in `wrangler.jsonc`) to see logs in Workers → Logs.
- D1 → charflut-db → **Time Travel** is on by default (point-in-time restore); add a weekly export to R2 later (plan 08).

## 12. Check it works

- `https://charflut.com` loads, the 3D hero appears after the still image.
- `/admin` asks for the Access login, then shows the dashboard; Settings shows each secret as **Set**.
- Admin → Providers shows both providers **Connected**; Sync now imports products as drafts.
- Place a WebXPay **staging** payment: the order shows in Admin → Orders as "Needs attention" until you confirm the amount, then **Approve and send to provider** creates the provider order.
- Run the launch gate: 10 test orders across both providers, USD and GBP, one refund.
