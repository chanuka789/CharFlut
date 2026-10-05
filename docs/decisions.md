# Decisions log

Newest first. Add a row for every decision that changes the plan.

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-05 | WebXPay orders are held as "Needs attention" until the amount is confirmed | The signed return does not cover the amount and the request uses a public key; confirm in the portal or via a status API |
| 2026-10-05 | Tailwind 4 reads the CharFlut CSS variables; shared component classes in src/styles/components.css | One design system for Astro and React islands |
| 2026-10-05 | Procedural 3D garment + vector mockups until GLB models and provider mockups arrive | Lets the full design ship now; swap is one component each |
| 2026-10-05 | Three.js loads lazily after idle | Keeps home JS before 3D near 145 KB gzipped (budget 250 KB) |
| 2026-10-05 | Magic-link customer accounts; Cloudflare Access for staff | No passwords to leak or reset |
| 2026-10-05 | Astro + React islands instead of Next.js | Lighter for a motion-heavy site; React only where needed |
| 2026-10-05 | Fashion look; removed hazard stripes and construction styling | CharFlut is a fashion brand, not construction |
| 2026-10-05 | CF monogram replaces the bar icon | Reads as a fashion label |
| 2026-10-05 | Palette Black / Sun Yellow / Stone Grey / White; Archivo + Inter | Chosen by the owner |
| 2026-10-05 | Both Printify and Printful behind one provider adapter | Compare providers and switch per product |
| 2026-10-05 | WebXPay cards at launch; PayPal later | Sri Lankan gateway; PayPal Checkout not yet open in Sri Lanka |
| 2026-10-05 | Cloudflare (Workers, D1, R2, Access) | Low cost, fast, free admin login |

## Open decisions

- Main provider for tees and hoodies at launch: Printify or Printful
- Tagline: "Clean cuts. Bold prints." or another option
- Domain name
