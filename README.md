# CharFlut

Fashion print-on-demand store for the US and UK. Clean cuts. Bold prints.

Astro 7 + React islands on Cloudflare Workers, with D1, R2, Queues and Access. Products come from Printify and Printful; card payments through WebXPay.

## Run it locally

```bash
npm install
npm run db:migrate:local
npm run dev
```

Open http://localhost:4321. The admin is at http://localhost:4321/admin (Cloudflare Access is skipped in local development, and the dashboard shows labelled sample data until you have orders). Copy `.dev.vars.example` to `.dev.vars` to add API keys.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with the Workers runtime (D1, R2, KV, Queues simulated locally) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Build, then run the real Worker locally with wrangler |
| `npm test` | Unit tests: money, pricing, checkout, WebXPay RSA and signatures, webhooks |
| `npm run check` | TypeScript and Astro checks |
| `npm run deploy` | Build and deploy to Cloudflare |
| `npm run db:migrate:remote` | Apply D1 migrations to the live database |

To go live, follow [docs/plan/13-cloudflare-setup.md](docs/plan/13-cloudflare-setup.md).

## Folder structure

```
CharFlut/
├── CLAUDE.md                 Guide for Claude Code (read first)
├── astro.config.mjs          Astro + Cloudflare adapter + React + Tailwind
├── wrangler.jsonc            Worker bindings (D1, R2, KV, Queues, Cron), prod + staging
├── migrations/               D1 schema
├── docs/plan/                Full plan (00–13), incl. complete build plan and Cloudflare guide
├── design/tokens/            tokens.json (source) and the type scale
├── public/                   Logos, favicon, robots.txt
├── tests/                    Vitest unit tests
└── src/
    ├── worker.ts             Worker entry: Astro + order queue consumer + nightly cron
    ├── middleware.ts         Currency, admin Access check, security headers
    ├── styles/               tokens.css, layout-tokens.css, components.css, global.css
    ├── layouts/              Base, Store, Content, Account, Checkout, Admin
    ├── components/           ui/, layout/, commerce/, product/, home/, checkout/, admin/
    ├── three/                3D garment, print-pass shader, hero, product viewer, 404
    ├── scripts/motion.ts     Lenis, GSAP reveals, parallax, pinned rails, cursor, CF wipe
    ├── data/catalog.ts       Launch catalogue (until the D1 sync is live)
    ├── lib/
    │   ├── providers/        Printify + Printful behind one adapter
    │   ├── payments/         WebXPay (RSA PKCS#1), PayPal (phase 2)
    │   └── server/           D1, orders, routing, sync, webhooks, auth, admin data
    └── pages/                Storefront, account, help, legal, checkout, admin, API routes
```

See [docs/plan/12-design-system.md](docs/plan/12-design-system.md) for the component library and [docs/plan/11-complete-ecommerce-plan.md](docs/plan/11-complete-ecommerce-plan.md) for every page and what is left before launch.
