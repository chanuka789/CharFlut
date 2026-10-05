# Page-by-page specs

Each page lists its sections from top to bottom, then its motion. The global header and footer are the same on every page.

### Global parts

- **Header:** CF logo left; Shop, Drops, Lookbook in the middle; search, account, wishlist and cart icons right. It hides when you scroll down and comes back when you scroll up. Free-shipping bar on top.
- **Mobile menu:** full-screen black panel, big Archivo links that slide in one by one.
- **Cart drawer:** opens from the right with items, size and quantity change, a free-shipping progress bar, “You may also like” and a yellow Checkout button.
- **Footer:** newsletter sign-up, link columns, currency switch (USD/GBP), payment logos, social links, a giant CHARFLUT wordmark that reveals on scroll.

### Home

1. **Hero:** dark full-screen stage, 3D tee with the “print pass”, headline “Clean cuts. Bold prints.”, buttons Shop now and View drop.
2. **Marquee** strip with the current offer.
3. **New drop:** pinned horizontal scroll of 6–8 products with large images.
4. **Shop by category:** two big tiles, Tees and Hoodies, with a parallax photo each.
5. **From flat to fabric:** 3 steps (Design, Print, Delivered) with a short animation for each, telling the print-on-demand story honestly.
6. **Lookbook teaser:** 3 model photos in a staggered grid with parallax.
7. **Best sellers** grid.
8. **Reviews:** real customer reviews only (from a review app or your own review system). Hidden until real reviews exist.
9. **Newsletter:** “Get first access to drops”, with a 10% welcome code.

### Shop (all products) and category pages

- Title band with product count and a short line of text.
- Filters: category, size, colour, price, fit (oversized or regular). Sort: new, popular, price.
- Product grid: 2 columns on mobile, 3–4 on desktop. Card shows front image, back image on hover, name, price, colour dots and a “New” tag.
- Infinite load with a “Load more” button as fallback.
- Motion: cards fade up in a stagger; light tilt on hover.

### Product page

1. **Media:** 3D viewer tab plus a photo gallery (mockups and model photos). Pinch or scroll to zoom.
2. **Info:** name, price in the visitor’s currency, colour swatches (3D model changes colour live), size buttons, size guide link, quantity, Add to cart (yellow), wishlist heart.
3. **Delivery box:** estimated delivery date for the visitor’s country, using the provider’s shipping times.
4. **Details:** fabric, fit, care, print method, made-to-order note (“printed just for you, ships in 2–5 days”).
5. **Complete the look** and **Recently viewed**.
6. Sticky Add-to-cart bar on mobile.

### Drops and Lookbook

- **Drops:** one page per collection with a story header, countdown before launch, product list and a waitlist form.
- **Lookbook:** full-screen editorial photos with parallax and product tags you can tap to shop.

### Search

Full-screen overlay, instant results while typing, popular searches, and a “no results” state with best sellers.

### Checkout

1. **Contact and shipping:** email, name, address with country (US or UK only), phone.
2. **Shipping method:** standard or express, with prices and dates from the provider.
3. **Review:** items, discount code, subtotal, shipping, tax, total.
4. **Pay:** “Pay with card” sends the customer to WebXPay, then back to the result page.
5. **Order confirmed:** order number, summary, email sent, and “Create an account” with one click.

No 3D, no parallax, no smooth scroll in checkout. Clear errors next to each field.

### Account

- Sign in with a magic link (a sign-in link sent by email), so there is no password to forget.
- Pages: Orders (status and tracking link), Addresses, Wishlist, Profile, Email preferences.
- **Track order** page for guests: order number plus email.

### Content and help pages

About (the brand story), Size guide (tables in cm and inches, plus a fit finder), Shipping, Returns and refunds, FAQ, Contact (form that creates a ticket in the admin), Privacy policy, Terms of service, Cookie policy, and Accessibility statement.

### System pages

404 page with a 3D CF monogram you can spin, a maintenance page, and a “Coming soon” page with a waitlist for before launch.
