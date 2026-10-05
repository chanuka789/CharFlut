/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare/types.d.ts" />

declare namespace App {
  interface Locals {
    currency: import('./lib/types').Currency;
    country: string;
    staff?: { email: string; role: 'owner' | 'manager' | 'support' };
  }
}
