# Admin dashboard

The admin lives at `/admin`, behind Cloudflare Access, so only approved email addresses can even load it. It uses a dark theme with yellow highlights, works on a phone, and every change is saved in an audit log.

| Module | Main screens and actions | Phase |
| --- | --- | --- |
| Overview | Today’s sales, orders, average order value, conversion, top products, alerts (failed orders, low margin) | 1 |
| Products | List, edit title, description, SEO, price, tags, images, 3D model link; Import from Printify or Printful; publish or hide | 1 |
| Pricing rules | Target margin per product type, auto-price from provider cost + shipping + payment fee, rounding to .99 | 1 |
| Orders | List with filters, order detail, payment status, provider status, tracking; actions: send to provider, cancel, resend, mark refunded | 1 |
| Provider connections | Printify shop ID and Printful store status, last sync time, webhook health, Sync now button | 1 |
| Payments | WebXPay transactions, match to orders, failed payments, payout notes, export CSV | 2 |
| Refunds and returns | Request list, reason, photos, refund amount, reprint request to provider | 2 |
| Customers | List, order history, total spent, notes, email preferences | 2 |
| Discounts | Codes (percent, fixed, free shipping), limits, dates, usage report | 2 |
| Collections and drops | Group products, set launch date and countdown, hero image and 3D light colour | 2 |
| Content | Home sections, banners, lookbook, FAQ, policy pages, with preview | 3 |
| Emails | Templates for order confirmed, shipped, delivered, abandoned cart, welcome | 3 |
| Reports | Sales by day, country, product, provider; profit after costs and fees | 3 |
| Support inbox | Contact form tickets, reply by email | 3 |
| Settings and users | Store details, currencies, shipping zones, tax settings, staff users and roles | 1–3 |
| Audit log | Who changed what and when | 3 |

**Roles:** Owner (everything), Manager (products, orders, customers, no settings), Support (orders and inbox only).
