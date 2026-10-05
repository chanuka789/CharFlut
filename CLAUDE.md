# CharFlut — guide for Claude Code

CharFlut is a fashion print-on-demand store (T-shirts and hoodies first) for US and UK customers. Read this file first, then the plan in `docs/plan/` before building any feature.

## Source of truth

| Topic | File |
| --- | --- |
| Full plan (index) | `docs/plan/README.md` |
| Brand guide, voice, colours | `docs/brand/brand-guide.md` |
| Logo rules | `docs/brand/logo-usage.md` |
| Design tokens (edit this) | `design/tokens/tokens.json` |
| CSS variables (generated from the JSON) | `src/styles/tokens.css` |
| Logos and favicon | `public/brand/`, `public/favicon.svg` |
| Decisions log | `docs/decisions.md` |
| Phase 1 backlog | `docs/backlog/phase-1.md` |
| Build status, every route | `docs/plan/11-complete-ecommerce-plan.md` |
| Components, motion API, breakpoints | `docs/plan/12-design-system.md` |
| Cloudflare setup | `docs/plan/13-cloudflare-setup.md` |

## Building pages

- Build every page from the shared layouts (`src/layouts/`) and components (`src/components/ui`, `commerce`, `product`, `admin`). Add a new component there rather than one-off markup.
- Use the type classes (`t-display`, `t-h1` … `t-label`), `cf-container` / `cf-section`, and the component classes in `src/styles/components.css` (`btn`, `badge`, `input`, `chip`, `swatch`, `panel`, `table table-stack`).
- Add motion with data attributes (`data-split`, `data-reveal`, `data-parallax`, `data-hscroll`, `data-tilt`, `data-magnetic`, `data-cursor`), not per-page scripts.
- Design mobile-first and check 375 px, 768 px, 1024 px and 1440 px. Grids already let children shrink; rails use `no-scrollbar` + snap on touch.
- Prices: render with `<Price>` (both currencies, CSS shows one) or `formatMoney`; never compute totals in the browser for payment.
- Three.js must stay lazily loaded (see `src/three/HeroScene.tsx`).
- Run `npm test` and `npm run check` before finishing.

If code and docs disagree, ask the owner before changing the plan. Record new decisions in `docs/decisions.md`.

## Stack

- Astro with the Cloudflare adapter, React islands, TypeScript (strict).
- Tailwind CSS that reads the CharFlut CSS variables. Never hard-code colours or fonts.
- Three.js through React Three Fiber and drei; GSAP (ScrollTrigger, SplitText) and Lenis for motion.
- Cloudflare Workers (API routes), D1 (database), R2 (images, 3D models), Queues, Cron Triggers, Access (admin).
- Payments: WebXPay redirect (cards). PayPal later.
- Print providers: Printify (v1 API) and Printful (v1 for sync products, v2 for orders, shipping, mockups) behind one provider adapter.

## Brand rules (must follow)

- Colours: Black `#111111`, Sun Yellow `#FFC800`, Stone Grey `#8C8C8C` (lines and shapes only, never small text), White, Paper `#F4F4F1`.
- Yellow is for ONE main action per screen. Text on yellow is always black. Never white text on yellow.
- Fonts: Archivo 800–900 for headings and buttons, Inter 400–600 for body (16px minimum).
- The look is modern fashion and streetwear: big photos, lots of white space, oversized type. No construction or hazard styling (no hazard stripes, no "site safety" wording).
- Voice: short, calm, confident. No fake urgency.
- Use the logo SVGs from `public/brand/`. Do not redraw or stretch them.

## Motion and 3D rules

- Every effect must help someone see or choose a product.
- Heavy effects only on Home, Drops and Product pages. Checkout has no 3D, no parallax, no smooth scroll.
- Respect `prefers-reduced-motion`: turn off smooth scroll, parallax and 3D animation, and use fades.
- Show a still image first, then load the 3D scene. Pause 3D when off screen. Weak devices get an image or video.
- Budgets: LCP under 2.5 s on 4G mobile, hero GLB under 1.5 MB, home JS under 250 KB before 3D.
- Accessibility target: WCAG 2.2 AA, full keyboard use, yellow focus outlines.

## Security rules

- Secrets (Printify token, Printful token, WebXPay keys, email keys) live only in Cloudflare Worker secrets, or in `.dev.vars` locally (git-ignored). Never commit them, log them or send them to the browser.
- Re-calculate prices and totals on the server. Never trust amounts from the browser.
- Mark an order `paid` only after the WebXPay signature is verified and the order ID and amount match.
- Send orders to a provider only after payment is confirmed.
- Webhooks: secret URL path, store each event once (idempotent), and re-fetch the object from the provider API before acting.
- The admin at `/admin` is protected by Cloudflare Access. Check the Access identity in the API as well.

## Working style

- Small, focused changes, with a short summary of what changed.
- Write tests for money, order routing, signature checks and webhook handling.
- Keep the provider-specific code inside `src/lib/providers/` behind the adapter interface.
