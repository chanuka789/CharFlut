/**
 * Product sync (plan 06): import title, variants (size and colour), costs and images from each provider.
 * New products arrive as drafts; the admin adds the CharFlut description, price and 3D settings, then publishes.
 * Existing products keep their CharFlut copy and prices; only provider facts (cost, stock, ids) are refreshed.
 */
import { configuredProviders, getProvider } from '@/lib/providers';
import type { SyncedProduct } from '@/lib/providers/types';
import { autoPrice } from '@/lib/pricing';
import { uid } from './db';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

export async function syncAllProducts(env: Env) {
  const report: { provider: string; imported: number; updated: number; error?: string }[] = [];
  for (const { id, ok } of configuredProviders(env)) {
    if (!ok) continue;
    try {
      const items = await getProvider(id, env).listProducts();
      let imported = 0,
        updated = 0;
      for (const p of items) (await upsertProduct(env, p)) === 'new' ? imported++ : updated++;
      report.push({ provider: id, imported, updated });
    } catch (e) {
      report.push({ provider: id, imported: 0, updated: 0, error: (e as Error).message });
    }
  }
  await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value_json, updated_at) VALUES ('last_sync', ?, datetime('now'))")
    .bind(JSON.stringify({ at: new Date().toISOString(), report }))
    .run();
  return report;
}

export async function upsertProduct(env: Env, p: SyncedProduct): Promise<'new' | 'updated'> {
  const d = env.DB;
  const existing = await d.prepare('SELECT id, category FROM products WHERE provider = ? AND provider_product_id = ?').bind(p.provider, p.providerProductId).first<{
    id: string;
    category: string;
  }>();
  const category = /hood/i.test(p.title) ? 'hoodies' : 'tees';
  const productId = existing?.id ?? uid('prd');
  if (!existing) {
    await d
      .prepare("INSERT INTO products (id, slug, title, category, description, provider, provider_product_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')")
      .bind(productId, `${slugify(p.title)}-${productId.slice(-4)}`, p.title, category, p.description ?? '', p.provider, p.providerProductId)
      .run();
  }
  const rule = await d.prepare('SELECT target_margin, shipping_share_usd, payment_fee_rate FROM pricing_rules WHERE category = ?').bind(existing?.category ?? category).first<{
    target_margin: number;
    shipping_share_usd: number;
    payment_fee_rate: number;
  }>();

  const stmts = p.variants.map((v) => {
    const suggested = autoPrice({ cost: v.cost, shippingShare: rule?.shipping_share_usd ?? 0, paymentFeeRate: rule?.payment_fee_rate, targetMargin: rule?.target_margin ?? 0.45 });
    // GBP starts from USD x 0.86 then .99 rounding; the admin can override both (plan 07: prices set per currency).
    const gbp = Math.ceil((suggested * 0.86 + 1) / 100) * 100 - 1;
    const colorId = slugify(v.colorName) || 'default';
    return d
      .prepare(
        `INSERT INTO variants (id, product_id, sku, size, color_id, color_name, color_hex, price_usd, price_gbp, cost_usd, provider, provider_product_id, provider_variant_id, in_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (product_id, color_id, size) DO UPDATE SET
           cost_usd = excluded.cost_usd, in_stock = excluded.in_stock, sku = excluded.sku,
           provider_variant_id = excluded.provider_variant_id, updated_at = datetime('now')`,
      )
      .bind(uid('var'), productId, v.sku ?? null, v.size, colorId, v.colorName, v.colorHex ?? '#cccccc', suggested, gbp, v.cost, p.provider, p.providerProductId, v.providerVariantId, v.inStock ? 1 : 0);
  });
  if (stmts.length) await d.batch(stmts);
  return existing ? 'updated' : 'new';
}
