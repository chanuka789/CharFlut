import { env } from 'cloudflare:workers';

/** D1 database, or null when the binding is missing (e.g. a preview without D1). */
export function db(): D1Database | null {
  return (env as unknown as Env).DB ?? null;
}

export function getEnv(): Env {
  return env as unknown as Env;
}

export const uid = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

export async function audit(actor: string, action: string, entity: string, entityId?: string, diff?: unknown) {
  await db()
    ?.prepare('INSERT INTO audit_log (actor, action, entity, entity_id, diff_json) VALUES (?, ?, ?, ?, ?)')
    .bind(actor, action, entity, entityId ?? null, diff ? JSON.stringify(diff) : null)
    .run();
}

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(init.headers ?? {}) },
  });
}
