# Motion and 3D system

Motion follows one rule: **every effect must help someone see or choose a product.** The heavy effects live on the Home, Drops and Product pages. Shop, cart and checkout stay quick and calm.

### Tools

| Job | Library | Why |
| --- | --- | --- |
| 3D scenes | Three.js through React Three Fiber and drei | The standard for web 3D, and drei gives ready camera controls, loaders and shadows |
| Scroll and timeline animation | GSAP with ScrollTrigger and SplitText | Free for commercial use, including all plugins, since version 3.13 ([GSAP 3.13](https://gsap.com/blog/3-13/)) |
| Smooth scrolling | Lenis | Smooth, inertia-style scroll that works with ScrollTrigger |
| Page transitions | Astro view transitions + GSAP | Pages change without a full reload, so the CF wipe can play |
| Small UI motion | CSS transitions | Hover, focus and button states need no JavaScript |
| 3D models | glTF/GLB files, compressed with Draco or Meshopt, KTX2 textures | Small files that load fast |

### Effects by page

| Effect | Where | Notes |
| --- | --- | --- |
| 3D garment “print pass” | Home hero | Custom shader reveals the artwork texture along a moving line |
| Parallax layers (background moves slower than foreground) | Home, Drops, About | 2–3 layers at most, built with ScrollTrigger |
| Pinned horizontal scroll | Home “New drop” strip | Vertical scroll moves products sideways |
| Text reveal (lines slide up) | All big headlines | SplitText, 0.6–0.8 s |
| 3D product viewer | Product page | Drag to rotate, swap colour live, zoom on print |
| Card tilt and image swap | Shop grid | Card tilts slightly and shows the back of the garment on hover |
| CF wipe | Between pages | About 0.7 s in total, skipped on repeat clicks |
| Add-to-cart fly | Product page | Product thumbnail flies into the cart icon |
| Marquee text | Home, footer | “NEW DROP • FREE SHIPPING OVER $60 •” loop |

### Motion tokens

- Durations: fast 150 ms (hover), base 300 ms (UI), slow 700 ms (reveals), hero 1.2 s.
- Easing: `power3.out` for entrances, `power2.inOut` for transitions, never bouncy easing on checkout.
- Distance: elements move 24–40px when they appear, never more.

### Performance budget

- Largest Contentful Paint (main content visible) under 2.5 s on 4G mobile; the hero shows a still image first, then the 3D scene loads after.
- Hero GLB model under 1.5 MB, textures under 1 MB in total.
- JavaScript on the home page under 250 KB compressed before the 3D loads.
- 3D pauses when off screen and runs at a lower pixel ratio on phones.
- Weak devices (low memory or few CPU cores) get a short looping video or a still image instead of live 3D.

### Accessibility

- If the visitor has “reduce motion” turned on, smooth scroll, parallax and the 3D animation turn off and simple fades are used instead.
- Every 3D view has a normal image gallery next to it, so nobody needs 3D to buy.
- Target: WCAG 2.2 AA (the common web accessibility standard), keyboard use everywhere, visible focus outlines in yellow.

### 3D garment models

You need one good GLB model each for the tee and the hoodie. Options: buy a licensed model from a 3D marketplace, or have a 3D artist make them in Marvelous Designer or CLO 3D and finish them in Blender. The artwork from Printify or Printful is applied as a texture on the chest or back. Budget roughly $50–300 per model; I’m not fully sure of current prices, so get quotes.
