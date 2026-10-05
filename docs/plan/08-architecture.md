# Technical architecture

One Cloudflare project serves the store, the API and the admin. Astro is the main framework: it sends plain HTML by default and loads React only for the parts that need it (3D viewer, cart, filters), which keeps a motion-heavy site fast. This replaces the earlier Next.js idea because Astro is lighter for this kind of site.

### Stack

| Layer | Choice |
| --- | --- |
| Framework | Astro with the Cloudflare adapter, React islands, TypeScript |
| Styling | Tailwind CSS with the CharFlut tokens (colours, fonts, spacing) |
| 3D and motion | Three.js, React Three Fiber, drei, GSAP, Lenis |
| API | Cloudflare Workers (Astro API routes) |
| Database | Cloudflare D1 (SQL) |
| Images and 3D files | Cloudflare R2, served through the CDN, resized with Cloudflare Images if needed |
| Background jobs | Cloudflare Queues (send orders, retries) and Cron Triggers (nightly sync) |
| Admin login | Cloudflare Access (free up to 50 users) |
| Customer login | Magic-link email with signed session cookies |
| Email | A transactional email service such as Resend or Postmark |
| Code and deploys | GitHub, with automatic deploys to Cloudflare on every push |
| Monitoring | Cloudflare analytics and logs, plus Sentry for errors |

### Main database tables (D1)

| Table | Holds |
| --- | --- |
| products | Title, slug, description, SEO, status, 3D model file, collection |
| variants | Size, colour, price USD and GBP, provider, provider IDs, cost |
| images | Product images and mockups (R2 keys), order |
| collections | Drops and categories, launch date, hero |
| customers | Email, name, marketing consent |
| addresses | Customer addresses |
| carts | Saved carts for abandoned-cart emails |
| orders | Number, customer, totals, currency, status, payment reference |
| order_items | Variant, quantity, price, provider order link |
| provider_orders | Provider, provider order ID, status, tracking |
| payments | WebXPay reference, status code, amount, fee, raw signed response |
| refunds | Order, amount, reason, status |
| discounts | Code, type, value, limits, dates |
| reviews | Product, rating, text, verified buyer flag |
| webhook_events | Provider, event ID, payload, processed time |
| admin_users and audit_log | Staff roles and every admin change |

### Security

- All secrets (provider tokens, WebXPay keys, email keys) are Worker secrets only.
- HTTPS everywhere, strict security headers, and a content security policy.
- Prices and totals are always re-calculated on the server; the browser’s numbers are never trusted.
- Rate limits on login, checkout and contact forms; Cloudflare Turnstile (a free captcha) on forms.
- Daily D1 backups exported to R2.
