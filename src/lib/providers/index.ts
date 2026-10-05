import type { ProviderId } from '@/lib/types';
import { createPrintful } from './printful';
import { createPrintify } from './printify';
import type { PrintProvider } from './types';

export type { PrintProvider } from './types';

/** Returns the adapter for a provider, built from Worker secrets. Throws if the provider is not configured. */
export function getProvider(id: ProviderId, env: Env): PrintProvider {
  if (id === 'printify') {
    if (!env.PRINTIFY_API_TOKEN || !env.PRINTIFY_SHOP_ID) throw new Error('Printify is not configured (PRINTIFY_API_TOKEN, PRINTIFY_SHOP_ID).');
    return createPrintify(env.PRINTIFY_API_TOKEN, env.PRINTIFY_SHOP_ID);
  }
  if (!env.PRINTFUL_API_TOKEN) throw new Error('Printful is not configured (PRINTFUL_API_TOKEN).');
  return createPrintful(env.PRINTFUL_API_TOKEN, env.PRINTFUL_STORE_ID);
}

export function configuredProviders(env: Env): { id: ProviderId; ok: boolean }[] {
  return [
    { id: 'printify', ok: !!(env.PRINTIFY_API_TOKEN && env.PRINTIFY_SHOP_ID) },
    { id: 'printful', ok: !!env.PRINTFUL_API_TOKEN },
  ];
}
