# Printify and Printful integration

Both providers connect through one **provider adapter**: the store talks to a single interface (`listProducts`, `getShippingRates`, `createOrder`, `confirmOrder`, `getOrder`), and each provider has its own small module behind it. This lets you compare the two, move a product from one to the other, and add a third provider later without changing the store.

### Setup

- **Printify:** create a shop with the “API” or custom integration option, then make a Personal Access Token with the scopes shops, catalog, products, orders, uploads and webhooks. The token is valid for one year, so add a renewal reminder.
- **Printful:** create a store of the “Manual order platform / API” type and a private token for it.
- Both tokens are stored only as Cloudflare Worker secrets. They never go in the code, the browser, or chat messages.

### Key endpoints

| Job | Printify (v1) | Printful |
| --- | --- | --- |
| Products you designed | `GET /v1/shops/{shop_id}/products.json` | `GET /store/products` (v1; sync products are not in v2 yet) |
| Publish to your store | Webhook `product:publish:started`, then `POST .../products/{id}/publishing_succeeded.json` | Products are pulled by the sync job |
| Catalog and costs | `GET /v1/catalog/blueprints.json` and print-provider variants | `GET /v2/catalog-products`, `GET /v2/catalog-variants/{id}/prices` |
| Mockups | Images come with the product | `POST /v2/mockup-tasks` |
| Shipping rates | `POST /v1/shops/{shop_id}/orders/shipping.json` | `POST /v2/shipping-rates` |
| Create order | `POST /v1/shops/{shop_id}/orders.json` | `POST /v2/orders` (draft) |
| Start production | `POST .../orders/{id}/send_to_production.json` | `POST /v2/orders/{id}/confirm` |
| Reprint or refund | `.../support-requests/reprint` and `/refund` | Through Printful support or dashboard |
| Rate limits | 600 requests per minute; catalog 100 per minute; publishing 200 per 30 minutes | About 120 requests per minute (v2) |

Sources: [Printify API](https://developers.printify.com/), [Printful API v2 (open beta)](https://developers.printful.com/docs/v2-beta/). Printful v2 is still in open beta, so endpoints may change; the adapter keeps that change in one place.

### Webhooks the store listens to

| Provider | Events | What the store does |
| --- | --- | --- |
| Printify | `product:publish:started`, `product:updated`, `product:deleted` | Import or update the product, then report success back |
| Printify | `order:sent-to-production`, `order:shipment:created`, `order:shipment:delivered`, `order:updated` | Update order status, email tracking to the customer |
| Printful | `order_created`, `order_updated`, `order_failed`, `order_cancelled` | Update status; failed orders raise an admin alert |
| Printful | `catalog_price_changed`, `catalog_stock_updated` | Re-check margins, hide out-of-stock colours or sizes |

Security: each webhook URL has a long secret path, and the Worker re-fetches the order or product from the provider API before trusting it. Every event is stored once (idempotent, meaning a repeat event does nothing twice).

### Product sync

1. You design the product in Printify or Printful as normal.
2. The sync job (on publish webhook, plus a nightly check) imports title, variants (size and colour), costs, images and print files.
3. The admin shows it as a draft. You add the CharFlut description, price and 3D settings, then publish.
4. Each variant stores `provider`, `provider_product_id` and `provider_variant_id`, so orders always go to the right place.

### Order routing

1. Payment is confirmed (never before).
2. The order is split by provider. One order with a Printify tee and a Printful hoodie becomes two provider orders and arrives as two parcels.
3. The Worker creates each provider order, then confirms or sends it to production.
4. If a provider call fails, it retries 3 times with growing delays, then shows the order as “Needs attention” in the admin.

Tip: to keep shipping simple at launch, put all tees and hoodies on **one** provider and use the second for later products or price tests.
