import type { APIRoute } from 'astro';
import { signOut } from '@/lib/server/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  await signOut(cookies);
  return redirect('/', 303);
};
