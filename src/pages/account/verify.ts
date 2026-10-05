import type { APIRoute } from 'astro';
import { consumeMagicLink } from '@/lib/server/auth';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const ok = await consumeMagicLink(url.searchParams.get('token') ?? '', cookies);
  return redirect(ok ? '/account' : '/account/sign-in?expired=1', 303);
};
