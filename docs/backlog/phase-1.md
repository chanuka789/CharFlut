# Phase 1 backlog — Launch store

Goal: a live store with 10–20 products, 3D hero, WebXPay checkout, automatic order routing and a basic admin. Gate: 10 test orders pass end to end.

## Setup
- [x] 1. Create the Astro project here with the Cloudflare adapter, React, TypeScript strict and Tailwind; keep existing files
- [x] 2. Wire Tailwind to `src/styles/tokens.css`; self-host Archivo (800, 900) and Inter (400–600)
- [~] 3. Add `wrangler` config with D1, R2, Queues bindings; create staging and production
- [x] 4. D1 migrations for the tables in `docs/plan/08-architecture.md`

## Storefront
- [x] 5. Layout: header, mobile menu, footer, cart drawer
- [x] 6. CF wipe page transition and Lenis smooth scroll (off for reduced motion and checkout)
- [x] 7. Home page sections (`docs/plan/04-page-specs.md`)
- [x] 8. 3D hero "print pass" with still-image fallback
- [x] 9. Shop and category pages with filters
- [x] 10. Product page with 3D viewer and gallery
- [x] 11. Search overlay
- [x] 12. Help and legal pages, 404, coming soon

## Providers
- [x] 13. Provider adapter interface in `src/lib/providers/`
- [x] 14. Printify module: products, publish flow, shipping, orders, webhooks
- [x] 15. Printful module: sync products (v1), shipping, orders, webhooks (v2)
- [~] 16. Product sync job and nightly cron

## Checkout and payments
- [x] 17. Checkout steps with server-side totals and provider shipping rates
- [~] 18. WebXPay: RSA encrypt, redirect form, signature verify (test padding first on staging)
- [x] 19. Order routing by provider through a Queue, with retries

## Admin
- [x] 20. `/admin` behind Cloudflare Access
- [x] 21. Overview, Products, Pricing rules, Orders, Provider connections

## Launch checks
- [ ] 22. Accessibility and Core Web Vitals check
- [ ] 23. 10 test orders: both providers, USD and GBP, one refund

## Status (2026-10-05)

[x] = code done in this repo; [~] = code done, needs Cloudflare resources, keys or real data. 3: wrangler.jsonc written, resource IDs pending. 16: sync job and cron written; storefront still reads src/data/catalog.ts. 18: WebXPay encrypt/verify written and tested against a generated key; confirm with a real staging payment. See docs/plan/11-complete-ecommerce-plan.md section 8 for what is left.
