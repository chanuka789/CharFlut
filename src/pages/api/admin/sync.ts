import type { APIRoute } from 'astro';
import { audit, getEnv } from '@/lib/server/db';
import { syncAllProducts } from '@/lib/server/sync';

/** "Sync now" button on Admin → Providers. */
export const POST: APIRoute = async ({ locals, redirect }) => {
  try {
    const report = await syncAllProducts(getEnv());
    await audit(locals.staff!.email, 'providers.sync', 'provider', undefined, report);
    return redirect('/admin/providers?done=sync', 303);
  } catch (e) {
    return redirect(`/admin/providers?error=${encodeURIComponent((e as Error).message)}`, 303);
  }
};
