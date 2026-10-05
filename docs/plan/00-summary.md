# Summary

CharFlut will be a fashion-first print-on-demand store for the US and UK. It will feel like an interactive lookbook (a styled photo catalogue) with real 3D garments, smooth scroll and page transitions, while staying fast enough to sell. The site runs on Cloudflare, gets products from both Printify and Printful through one sync layer, takes card payments through WebXPay, and is managed from a custom admin dashboard.

| Area | Decision |
| --- | --- |
| Products | T-shirts and hoodies first, more later |
| Markets | US and UK, prices in USD and GBP |
| Look | Black, Sun Yellow #FFC800, Stone Grey, white. Archivo 800–900 for headings, Inter for body text. CF monogram |
| Front end | Astro site with React islands, Three.js through React Three Fiber, GSAP and Lenis for motion |
| Hosting | Cloudflare Workers, D1 (database), R2 (image storage), Access (admin login) |
| Print providers | Printify and Printful, both connected. Each product is linked to one provider |
| Payments | WebXPay cards at launch. PayPal when PayPal Checkout opens for Sri Lankan sellers |
| Admin | Custom dashboard at /admin, built in 3 phases |

The goal for launch: a working store with 10–20 products, a 3D hero, checkout that sends orders to the right provider automatically, and an admin you can run from your phone.
