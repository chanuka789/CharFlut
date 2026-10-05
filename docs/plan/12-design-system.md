# Design system and component library

Every page is built from the same tokens, layouts and components so the look stays consistent. Change a token or a component once and every page follows.

## Layers

| Layer | File(s) | What it holds |
| --- | --- | --- |
| Brand tokens | `design/tokens/tokens.json` → `src/styles/tokens.css` | Colours (light + dark), spacing, radius, fonts, motion durations and easing |
| Responsive tokens | `src/styles/layout-tokens.css` | Fluid type (`--fs-display` … `--fs-label`), gutters, section rhythm, header heights, focus ring |
| Tailwind bridge | `src/styles/global.css` (`@theme inline`) | Tailwind utilities read the tokens: `bg-brand`, `text-ink`, `bg-surface`, `border-line`, `font-display`, `rounded-md` … |
| Component CSS | `src/styles/components.css` | `.btn` variants, `.badge`, `.input`, `.chip`, `.swatch`, `.panel`, `.table` (+ `.table-stack`), `.marquee`, `.drawer`, cursor, wipe |
| Type classes | `global.css` | `.t-display .t-h1 .t-h2 .t-h3 .t-lead .t-small .t-label .t-price`, `.cf-container`, `.cf-section`, `.cf-prose` |

Rule: components never hard-code colours or fonts; they use tokens or the classes above.

## Layouts

| Layout | Used by |
| --- | --- |
| `BaseLayout.astro` | Every page: SEO, Open Graph, JSON-LD, view transitions, CF wipe, cursor, motion script |
| `StoreLayout.astro` | Storefront: header, footer, global overlays (cart, search, menu, toasts) |
| `ContentLayout.astro` | Help and legal: title band, side nav (tabs on phones), prose column |
| `AccountLayout.astro` | Account area with side nav / mobile tabs |
| `CheckoutLayout.astro` | Calm checkout: minimal header, no motion, no wipe |
| `AdminLayout.astro` | Dark admin: sidebar, top bar, bottom tabs + "More" sheet on phones |

## Components

**UI primitives** (`src/components/ui/`): `Button` (primary / dark / outline / ghost, sm–lg, arrow, magnetic), `Icon` + `IconR` (one icon set), `Price` (both currencies, CSS shows one), `Section`, `SectionHeader`, `PageHeader`, `Breadcrumbs` (+ JSON-LD), `Field`, `Accordion`, `Marquee`, `EmptyState`, `Logo`.

**Layout parts** (`src/components/layout/`): `Header` (auto-hide, transparent over dark heroes), `Footer` (newsletter, links, currency, giant wordmark).

**Commerce** (`src/components/commerce/`): `ProductCard`, `ProductGrid`, `ShopView` (filters + sort), `HeaderActions`, `Panels` → `CartDrawer`, `SearchOverlay`, `MobileMenu`, `CartPage`, `Wishlist`, `Countdown`, `NewsletterForm`, `WaitlistForm`, `OrderTimeline`, `StatusBadge`.

**Product** (`src/components/product/`): `Garment` (vector mockup for any category / colour / print / view), `ProductMedia` (gallery + 3D tab), `BuyBox`, `RecentlyViewed`, `FitFinder`.

**Home** (`src/components/home/`): `Hero`, `DropRail`, `CategoryTiles`, `FlatToFabric`, `Editorial`, `LookbookTeaser`, `NewsletterBand`.

**Admin** (`src/components/admin/`): `KpiCard`, `AdminCard`, `AreaChart` (crosshair tooltip, keyboard, table view), `BarList`, `QueryTable`, `Notice`, `PriceCalculator`.

**3D** (`src/three/`): `GarmentMesh` (shared garment + print-pass shader), `HeroScene`, `ProductViewer`, `Monogram404`, `printTexture`, `capability`.

## Motion API (data attributes)

Add an attribute in any page; `src/scripts/motion.ts` does the rest.

| Attribute | Effect |
| --- | --- |
| `data-split` | Headline lines slide up |
| `data-reveal` / `data-reveal="fade"` | Fade up (or fade) on scroll |
| `data-stagger` | Children reveal in sequence |
| `data-parallax="0.2"` | Parallax layer (negative = opposite direction) |
| `data-zoom` | Image eases from 118% to 100% while scrolling |
| `data-hscroll` + `data-hscroll-track` | Pinned horizontal rail (desktop), swipe (touch) |
| `data-tilt` | 3D tilt on hover |
| `data-magnetic` | Pulls toward the cursor |
| `data-cursor="view" / "drag"` | Cursor label |
| `data-countdown="ISO date"` | Live countdown |
| `<body data-motion="calm">` | Turns motion off for that page (checkout, admin) |

## Responsive rules

| Width | Name | Behaviour |
| --- | --- | --- |
| < 480 px | phone | 16 px gutter, 2-column product grid, stacked card titles, bottom sheets for filters and admin menu, sticky add-to-cart bar, tables become cards |
| 480–767 | large phone | Same, larger type via fluid tokens |
| 768–1023 | tablet | 3-column grid, swipe rails, mobile menu and filter sheet stay |
| 1024–1439 | laptop | Desktop nav, filter sidebar, pinned rails, sticky buy box, admin sidebar |
| ≥ 1440 | desktop / wide | 4-column grid, max content width 1680 px, display type up to 160 px |

Also: fluid type with `clamp()` (no breakpoint jumps), `svh`/`dvh` heights for mobile browser bars, `env(safe-area-inset-*)` on bottom bars, 44 px minimum touch targets, 16 px minimum inputs (no iOS zoom), grid items allowed to shrink (`min-width: 0`) so rails never widen the page, and hover effects only for `(hover: hover)` devices.

## Accessibility checklist built in

Skip link, yellow-on-black focus ring on every control, dialogs with focus trap + Escape + focus return, `aria-live` cart and price updates, swatches and sizes as radio groups, error text linked with `aria-describedby`, chart table view for screen readers, reduced-motion support, 3D always paired with a photo gallery.
