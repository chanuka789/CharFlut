# Complete e-commerce plan (build edition)

This file joins sections 00–10 into one build plan and records what is already built in this repo. Status key: **Built** = working code in `src/`, **Wired** = code written, needs keys or data to run live, **Planned** = phase 2 or 3.

## 1. What CharFlut is

A fashion print-on-demand store for the US and UK. Tees and hoodies first. Every piece is printed after the customer pays, by Printify or Printful, and shipped to the customer. The site is an "interactive lookbook": big type, real 3D garments, smooth motion, and a calm, fast checkout.

| Decision | Choice |
| --- | --- |
| Markets and money | US (USD) and UK (GBP, VAT-inclusive prices). Prices set per currency, not converted live |
| Front end | Astro 7 + React 19 islands, Tailwind 4 on CharFlut tokens, Three.js via React Three Fiber, GSAP 3.15 + Lenis |
| Back end | Cloudflare Workers (Astro server routes), D1, R2, KV (sessions), Queues (order routing), Cron (nightly sync), Access (admin) |
| Providers | Printify (v1) and Printful (v1 sync products, v2 orders/shipping/mockups) behind one adapter |
| Payments | WebXPay cards at launch. PayPal in phase 2. Apple Pay / Google Pay only if WebXPay supports them |

## 2. Page inventory (every route)

### Storefront

| Route | Page | Key parts | Status |
| --- | --- | --- | --- |
| `/` | Home | 3D print-pass hero, marquee, pinned drop rail, category tiles, "From flat to fabric", lookbook teaser, best sellers, newsletter | Built |
| `/shop` | All products | Title band + count, filters (category, fit, size, colour, max price), sort, 2/3/4-column grid | Built |
| `/shop/[category]` | Tees, Hoodies | Same view, category fixed | Built |
| `/shop/[category]/[slug]` | Product | Photo gallery + 3D viewer tab, buy box (colour → 3D live), sizes, qty, add-to-cart fly, delivery estimate, accordion details, complete the look, recently viewed, sticky mobile bar, Product JSON-LD | Built |
| `/drops` | Drops list | Editorial cards, live / launch date | Built |
| `/drops/[slug]` | Drop | Dark story header in the drop's light colour, countdown + waitlist before launch, products | Built |
| `/lookbook` | Lookbook | Full-bleed editorial frames, parallax, tap-to-shop tags | Built (placeholder art until the photo shoot) |
| `/about` | Brand story | Parallax layers, values | Built |
| `/search` | Search results | Also the target of the search overlay | Built |
| overlay | Search | Instant results, popular searches, best sellers when empty | Built |
| drawer | Cart | Lines, qty, free-shipping progress, suggestions, yellow Checkout | Built |
| `/cart` | Full cart | Summary with server note | Built |
| `/checkout` | Checkout | 1 Details → 2 Shipping → 3 Review & pay; server quote; mobile summary toggle | Built |
| `/checkout/result` | Payment return | WebXPay signature check, success / held / declined views | Wired |
| `/track-order` | Guest tracking | Order number + email → timeline + tracking links | Wired |
| `/account/sign-in`, `/account/verify` | Magic link | No passwords, 20-minute single-use links | Wired (needs email key) |
| `/account`, `/orders`, `/addresses`, `/wishlist`, `/profile` | Account | Overview, order table, saved addresses, wishlist, consent + data request | Built |
| `/help/size-guide` | Size guide | cm + inches tables, fit finder | Built (replace sample measurements) |
| `/help/shipping`, `/help/returns`, `/help/faq` | Help | FAQ has FAQPage JSON-LD | Built (legal review) |
| `/contact` | Contact | Ticket into admin inbox, Turnstile when keyed | Built |
| `/legal/privacy`, `/terms`, `/cookies`, `/accessibility` | Legal | Drafts for review | Built |
| `/404`, `/maintenance`, `/coming-soon` | System | 3D spinnable CF tile, 503 page, waitlist with countdown | Built |

### Admin (`/admin`, behind Cloudflare Access)

| Route | Module | Phase | Status |
| --- | --- | --- | --- |
| `/admin` | Overview: sales today, orders, AOV, conversion, 30-day chart, alerts, top products, sales by country | 1 | Built |
| `/admin/orders`, `/admin/orders/[number]` | Orders: filters, search, detail, payments, provider orders, actions (approve, retry, refund mark, cancel) | 1 | Built |
| `/admin/products`, `/admin/products/[id]` | Products with margin badges; edit form (details, prices USD/GBP, SEO, status, 3D) | 1 | Built (saving lands with D1 product source) |
| `/admin/pricing` | Rules per type + live calculator + low-margin list | 1 | Built |
| `/admin/providers` | Printify/Printful status, last sync, webhook URLs, event log, Sync now | 1 | Built |
| `/admin/settings` | Store, payments, providers, security status (secrets shown as Set/Missing only) | 1 | Built |
| `/admin/payments`, `/refunds`, `/customers`, `/discounts`, `/drops` | Phase 2 modules on D1 | 2 | Built (read views) |
| `/admin/content`, `/emails`, `/reports`, `/inbox`, `/audit-log` | Phase 3 modules | 3 | Built (read views) |

Admin layout: sidebar on desktop; top bar + bottom tab bar + "More" sheet on phones. Roles: Owner, Manager, Support (from `ADMIN_OWNERS` / `ADMIN_MANAGERS`).

### API routes

| Route | Purpose |
| --- | --- |
| `POST /api/checkout/quote` | Server-priced totals (lines, discount, shipping, VAT/tax) |
| `POST /api/checkout/create` | Validate, re-price, create `pending_payment` order, return encrypted WebXPay form |
| `POST /checkout/result` | WebXPay return: verify signature, record payment once, mark paid or hold |
| `POST /api/webhooks/printify/[secret]` | Product publish/update/delete, order + shipment events |
| `POST /api/webhooks/printful/[secret]` | Order, shipment, catalog price/stock events |
| `POST /api/webhooks/paypal` | Phase 2, signature verified via PayPal API |
| `POST /api/newsletter`, `POST /api/contact` | Sign-ups and support tickets |
| `POST /api/auth/sign-out` | End session |
| `POST /api/admin/sync`, `POST /api/admin/orders/[number]` | Admin actions (Access-checked, audit-logged) |
| Queue `charflut-orders` | Route paid orders to providers, 3 retries (30 s, 2 min, 8 min), then "Needs attention" |
| Cron `0 3 * * *` | Nightly product sync |

## 3. Customer journeys

1. **Discover → buy (phone):** Home hero (still image first, 3D after) → swipe the drop rail → product → pick colour (3D recolours) and size → Add to cart (thumbnail flies to the bag, drawer opens) → Checkout → WebXPay → result page → email receipt.
2. **Guest → account:** after paying, "Create an account" sends a magic link to the same email; past guest orders attach automatically.
3. **Where is my order?** `/track-order` or Account → Orders → tracking links per parcel (two parcels when both providers are in one order).
4. **Something is wrong:** Contact (topic "Return or fault") → ticket in Admin → Inbox → refund in WebXPay portal + "Mark refunded", or provider reprint.

## 4. Printify and Printful integration

Code: `src/lib/providers/` — `types.ts` (the `PrintProvider` interface), `printify.ts`, `printful.ts`, `index.ts` (`getProvider`).

| Step | Printify | Printful |
| --- | --- | --- |
| Auth | Personal Access Token (1-year expiry: set a renewal reminder) + shop ID | Private token for a Manual/API store (+ store ID if the token covers several) |
| List products | `GET /v1/shops/{shop}/products.json` (paged) | `GET /store/products` then `GET /store/products/{id}` (v1) |
| Costs | Variant `cost` on the product | `GET /v2/catalog-variants/{id}/prices` (sync job fills `cost_usd`) |
| Shipping quote | `POST /v1/shops/{shop}/orders/shipping.json` | `POST /v2/shipping-rates` |
| Create order (draft) | `POST /v1/shops/{shop}/orders.json` with `external_id` | `POST /v2/orders` with `external_id` |
| Start production | `POST .../orders/{id}/send_to_production.json` | `POST /v2/orders/{id}/confirm` |
| Status / tracking | `GET .../orders/{id}.json` | `GET /v2/orders/{id}`, `/v2/orders/{id}/shipments` |
| Cancel | `POST .../orders/{id}/cancel.json` | `DELETE /v2/orders/{id}` |
| Publish handshake | `product:publish:started` → import → `POST .../publishing_succeeded.json` | Pulled by sync |

**Sync rules** (`src/lib/server/sync.ts`): new products arrive as `draft`; suggested prices come from the pricing rule; existing products keep CharFlut copy and prices; only cost, stock and provider IDs refresh. Catalog price/stock webhooks trigger a re-sync, and the admin flags margins under 30–35%.

**Routing rules** (`src/lib/server/routing.ts`): never before payment; one provider order per provider (`UNIQUE(order_id, provider)`); create as draft, then confirm; retryable errors (429/5xx/network) go back to the queue; non-retryable errors mark the order "Needs attention". Running it twice is safe.

**Webhook rules:** long secret path, each event stored once (`webhook_events` unique key), the order/product is always re-fetched from the provider API before acting, work runs in `waitUntil` so the provider gets a fast 200.

**Launch tip:** put all tees and hoodies on one provider so each order ships as one parcel; use the second for later products and price tests.

## 5. Payment methods

| Method | Phase | How | Notes |
| --- | --- | --- | --- |
| WebXPay (Visa, Mastercard) | Launch | Redirect form, RSA PKCS#1 v1.5 encrypted `order_id|amount`, signed return | `src/lib/payments/webxpay.ts`, tested with a generated key pair |
| PayPal Checkout | 2 | Orders API v2 create → approve → capture; webhook verify | `src/lib/payments/paypal.ts`; switches on when `PAYPAL_CLIENT_ID/SECRET` are set and PayPal Checkout is available to Sri Lankan sellers |
| Apple Pay / Google Pay | If offered by WebXPay | Through the WebXPay page | Ask WebXPay |
| Stripe / Shopify Payments | Not available | Need a business in a supported country | Revisit only if you register a US or UK company (needs advice) |

**Important finding while building WebXPay:** the signed return covers order ID, reference, date, gateway, status and comment, **not the amount**, and the request is encrypted with WebXPay's *public* key, so anyone could encrypt a different amount. The code therefore **holds** every WebXPay-paid order as "Needs attention" until the amount is confirmed (merchant portal now; a server-to-server status API if WebXPay provides one), and only then routes it to production. Ask WebXPay in writing:

1. Is there a status/query API or server notification that returns the captured amount? (Then set `amountVerified: true` after that call in `src/pages/checkout/result.astro`.)
2. Exact field list and `enc_method` value for the current integration kit.
3. GBP charging and payout, refund API, POD clothing accepted.

**Money rules (implemented):** integer minor units everywhere; prices and totals re-computed on the server; UK prices include 20% VAT (shown, not added); US sales tax hook ready (0 until registered in a state); discount codes validated on the server; every payment stored once per gateway reference.

## 6. Data model

`migrations/0001_init.sql`: collections, products, variants, images, customers, addresses, sessions, magic_links, carts, discounts, orders, order_items (with provider product + variant IDs), provider_orders, payments, refunds, reviews, webhook_events, subscribers, tickets, settings, pricing_rules, admin_users, audit_log.

The storefront currently reads the launch catalogue from `src/data/catalog.ts` (same shape as the tables). Swapping the catalogue source to D1 is phase 1 task 16 below.

## 7. Design, motion and 3D

See `12-design-system.md` for the component library and responsive rules. Signature moments built:

1. **Print pass** — `src/three/HeroScene.tsx` + `GarmentMesh.tsx`: procedural puffy tee with a shader that sweeps a yellow light line and reveals the artwork as you scroll; fabric ripples with scroll speed.
2. **CF wipe** — yellow panel with the CF mark between pages (Astro view transitions + GSAP), skipped on repeat clicks and for reduced motion.
3. **Magnetic cursor** — dot grows to "View" on products and "Drag" on 3D; buttons pull toward it (fine pointers only).
4. **Pinned drop rail** — vertical scroll moves products sideways on desktop; native swipe with snap on touch.
5. **Drops as events** — countdown, waitlist, per-drop light colour.

Plus: split-line headline reveals, staggered fade-ups, 2–3 layer parallax, card tilt + back-of-garment swap, marquee, giant footer wordmark, 3D product viewer with live colour, 3D 404 tile.

Rules kept: heavy effects only on Home, Drops, Product; checkout is calm (no Lenis, no wipe, no cursor); `prefers-reduced-motion` turns off smooth scroll, parallax, pinning and 3D; still image first, 3D after idle; 3D paused off screen; weak devices (≤4 GB RAM, <4 cores, Save-Data) keep the still image; a 4-second safety net shows all content if the motion script fails.

Measured on the production build: home JavaScript before 3D ≈ 145 KB gzipped (budget 250 KB). Three.js and the scene (≈ 255 KB gzipped) are fetched only after the browser is idle, via a lazy import in `HeroScene.tsx`.

## 8. Roadmap from here

### Phase 1 — launch (remaining)

- [ ] 13. Cloudflare resources and secrets (see `13-cloudflare-setup.md`)
- [ ] 14. WebXPay staging keys; confirm RSA padding with a real staging payment; get written answers (section 5)
- [ ] 15. Connect Printify and Printful; run Sync now; set prices and publish
- [ ] 16. Switch storefront reads from `src/data/catalog.ts` to D1 (`products`, `variants`, `images`), and checkout pricing to D1 variants with real provider IDs
- [ ] 17. Product photography / provider mockups to R2; replace the vector placeholders in `Garment.tsx` usage
- [ ] 18. Real GLB models for tee and hoodie (≤1.5 MB, Draco/Meshopt), swapped in `GarmentMesh.tsx`
- [ ] 19. Order confirmation email (Resend), OG image 1200×630, real size-guide measurements
- [ ] 20. Accessibility + Core Web Vitals check on real devices; legal review of policies
- [ ] 21. Launch gate: 10 test orders (both providers, USD and GBP, one refund)

### Phase 2 — grow

PayPal; discounts from D1 with an editor; refunds workflow with photos and provider reprints; customer notes; drops editor (launch date, light colour, hero); reviews (verified buyers only, shown when real reviews exist); wishlist synced to accounts; abandoned-cart capture.

### Phase 3 — scale

Content editor with preview; email templates (shipped, delivered, abandoned cart, welcome); reports with profit; support inbox replies; audit log UI filters; 3D customiser.

## 9. Open questions (owner)

- Main provider for tees and hoodies at launch: Printify or Printful?
- WebXPay written answers (section 5)
- Tagline: "Clean cuts. Bold prints." (used in the build) or another
- Domain (charflut.com assumed in config) and business email
- UK returns policy and VAT registration timing (legal and accounting advice)
