# Payments

Launch with **WebXPay card payments** (Visa and Mastercard) through its redirect page. Add **PayPal** when PayPal Checkout opens for Sri Lankan sellers. Card details never touch the CharFlut server, which keeps the security burden low.

### Payment methods

| Method | Status | How it works |
| --- | --- | --- |
| WebXPay cards | Launch | Customer is redirected to WebXPay, pays, and comes back with a signed result |
| PayPal | Later | PayPal Checkout buttons and the Orders API, with webhooks for capture and refunds. In Sri Lanka, PayPal currently supports receiving and withdrawing through selected banks, with Checkout listed as coming soon |
| Apple Pay and Google Pay | Only if WebXPay supports them | Ask WebXPay |

### WebXPay checkout flow

1. Customer clicks Pay. The Worker creates an order in D1 with status `pending_payment` and a unique order ID.
2. The Worker encrypts `order_id|amount` with WebXPay’s public key (RSA) and builds the form: name, email, phone, address, `secret_key`, `payment`, `process_currency` (USD or GBP), and the CharFlut order ID in custom fields.
3. The browser posts the form to WebXPay (staging first, live after testing).
4. WebXPay redirects back to `/checkout/result` with `payment` and `signature`.
5. The Worker verifies the signature with WebXPay’s public key, checks the order ID and amount match, and only then marks the order `paid` (status code 0 or 00 = approved).
6. Paid orders go to the provider (see Order routing). Declined orders show a friendly retry page.

### Open points to confirm with WebXPay in writing

- They accept a print-on-demand clothing business.
- A server-to-server payment notification or status API exists (so an order is not lost if the customer closes the browser before the redirect).
- A refund API exists, or refunds are only done in their merchant portal.
- GBP charging and payout are available, not only USD.
- The exact RSA padding, so the Worker can match it with Web Crypto (needs a small test).

### Money rules

- Prices are set per currency (USD and GBP), not converted live, so they look clean ($34.99 and £29.99).
- Currency is picked from the visitor’s country (Cloudflare tells the Worker), and can be changed in the footer.
- Every order stores amount, currency, WebXPay fee, provider cost and shipping cost, so the admin can show real profit.
- Refunds: the admin records the refund and, if the item was faulty, asks the provider for a reprint or refund.
