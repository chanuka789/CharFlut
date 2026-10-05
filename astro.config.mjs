// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://charflut.com',
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/account') &&
        !page.includes('/checkout') &&
        !page.includes('/maintenance'),
    }),
  ],
  // WebXPay posts the payment result back to /checkout/result from its own domain, so Astro's
  // same-origin form check must be off. JSON APIs are unaffected; forms here change nothing sensitive.
  security: { checkOrigin: false },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['gsap', 'lenis'],
    },
  },
});
