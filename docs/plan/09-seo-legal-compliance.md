# SEO, performance, legal and compliance

The biggest legal points are UK VAT and the UK 14-day return right; get a short check from an accountant and a lawyer before launch. I’m not a lawyer or tax advisor, so treat this list as a starting checklist.

### SEO

- Every page is server-rendered HTML, so search engines can read it without running the 3D.
- Product structured data (schema.org Product, Offer, Review), breadcrumbs, and an XML sitemap.
- Clean URLs: `/shop/hoodies/oversized-cf-hoodie-black`.
- Unique titles and descriptions per product, image alt text, and Open Graph images for social sharing.
- Separate US and UK price display with `hreflang` (en-US, en-GB) if you later use separate URLs.

### Performance targets

- Core Web Vitals “good”: LCP under 2.5 s, INP under 200 ms, CLS under 0.1.
- Images in AVIF or WebP, lazy-loaded, with fixed sizes so the layout does not jump.
- Fonts: only Archivo 800–900 and Inter 400–600, self-hosted, with `font-display: swap`.

### Legal and compliance (US and UK)

| Topic | What to do | Confidence |
| --- | --- | --- |
| UK VAT | For goods of £135 or less sent to UK consumers, the seller charges UK VAT at checkout, and a business not based in the UK has no VAT registration threshold. Plan to register before UK sales start | Needs verification with an accountant |
| US sales tax | Each state has its own “economic nexus” threshold (often $100,000 of sales). Track sales by state from day one | Needs verification |
| UK returns | UK consumers usually have 14 days to cancel online orders. The exception for personalised goods may not cover designs you sell to everyone. Offer at least faulty-item replacements and decide your returns policy with advice | I’m not fully sure; get legal advice |
| Privacy | UK GDPR and US state privacy laws (such as California’s CCPA): privacy policy, cookie banner for non-essential cookies, data export and delete on request | Standard |
| Cookies and analytics | Use cookie-light analytics (Cloudflare Web Analytics) to need fewer consent pop-ups | Standard |
| Product safety | Printify shows GPSR (EU product safety) info per product; keep care labels and safety info on product pages | Standard |
| Accessibility | WCAG 2.2 AA and an accessibility statement page | Standard |
| Trademark | Register the CharFlut name and CF logo in the UK and US before scaling | Recommended |

Sources: [UK low-value goods VAT rule (Landmark Global)](https://landmarkglobal.com/eu/en/news-insights/uk-vat-on-low-value-goods-the-135-threshold-rule/), [Consumer Contracts Regulations 2013, regulation 28](https://www.legislation.gov.uk/uksi/2013/3134/regulation/28), [Distance sales guide (Business Companion)](https://www.businesscompanion.info/en/quick-guides/distance-sales/consumer-contracts-distance-sales).
