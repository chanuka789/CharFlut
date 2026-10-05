/**
 * Printify v1 API (https://developers.printify.com/). Token scopes: shops, catalog, products, orders, uploads, webhooks.
 * Rate limits: 600 req/min general, 100 req/min catalog, 200 publishes / 30 min.
 */
import {
  providerFetch,
  type PrintProvider,
  type ProviderLine,
  type ProviderOrder,
  type ProviderOrderStatus,
  type Recipient,
  type ShippingRate,
  type SyncedProduct,
} from './types';

const BASE = 'https://api.printify.com/v1';

type PfyVariant = { id: number; sku: string; cost: number; price: number; title: string; is_enabled: boolean; is_available: boolean; options: number[] };
type PfyOption = { name: string; type: string; values: { id: number; title: string; colors?: string[] }[] };
type PfyProduct = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: PfyOption[];
  variants: PfyVariant[];
  images: { src: string; variant_ids: number[]; position: string; is_default: boolean }[];
};
type PfyOrder = {
  id: string;
  status: string;
  total_price?: number;
  total_shipping?: number;
  shipments?: { carrier: string; number: string; url: string }[];
};

export function createPrintify(token: string, shopId: string): PrintProvider {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'CharFlut' };
  const call = <T>(path: string, init: RequestInit = {}) => providerFetch<T>('printify', `${BASE}${path}`, { ...init, headers });

  const map = (p: PfyProduct): SyncedProduct => {
    const optionValue = (id: number) => {
      for (const o of p.options) {
        const v = o.values.find((x) => x.id === id);
        if (v) return { type: o.type, title: v.title, hex: v.colors?.[0] };
      }
      return null;
    };
    return {
      provider: 'printify',
      providerProductId: p.id,
      title: p.title,
      description: p.description,
      tags: p.tags,
      images: p.images.map((i) => ({ src: i.src, variantIds: i.variant_ids.map(String), position: i.position })),
      variants: p.variants
        .filter((v) => v.is_enabled)
        .map((v) => {
          const opts = v.options.map(optionValue).filter(Boolean) as { type: string; title: string; hex?: string }[];
          const color = opts.find((o) => o.type === 'color');
          const size = opts.find((o) => o.type === 'size');
          return {
            providerVariantId: String(v.id),
            sku: v.sku,
            size: size?.title ?? v.title,
            colorName: color?.title ?? 'Default',
            colorHex: color?.hex,
            cost: v.cost,
            inStock: v.is_available,
          };
        }),
    };
  };

  const mapStatus = (s: string): ProviderOrderStatus => {
    if (['canceled', 'cancelled'].includes(s)) return 'cancelled';
    if (s === 'fulfilled' || s === 'partially-fulfilled') return 'shipped';
    if (s === 'in-production' || s === 'sending-to-production') return 'in_production';
    if (s === 'has-issues') return 'failed';
    return 'created';
  };
  const mapOrder = (o: PfyOrder): ProviderOrder => ({
    externalId: o.id,
    status: mapStatus(o.status),
    cost: o.total_price,
    shippingCost: o.total_shipping,
    shipments: (o.shipments ?? []).map((s) => ({ carrier: s.carrier, trackingNumber: s.number, trackingUrl: s.url })),
  });

  const toAddress = (r: Recipient) => ({
    first_name: r.name.split(' ')[0],
    last_name: r.name.split(' ').slice(1).join(' ') || '-',
    email: r.email,
    phone: r.phone ?? '',
    country: r.country,
    region: r.region ?? '',
    address1: r.address1,
    address2: r.address2 ?? '',
    city: r.city,
    zip: r.zip,
  });
  const toItems = (lines: ProviderLine[]) =>
    lines.map((l) => ({ product_id: l.providerProductId, variant_id: Number(l.providerVariantId), quantity: l.quantity }));

  // Printify order ids are their own; we keep a map external_id -> printify id in provider_orders.external_id.
  return {
    id: 'printify',

    async listProducts() {
      const out: SyncedProduct[] = [];
      let page = 1;
      for (;;) {
        const res = await call<{ data: PfyProduct[]; last_page: number }>(`/shops/${shopId}/products.json?limit=50&page=${page}`);
        out.push(...res.data.map(map));
        if (page >= res.last_page) break;
        page++;
      }
      return out;
    },

    async getProduct(id) {
      return map(await call<PfyProduct>(`/shops/${shopId}/products/${id}.json`));
    },

    async getShippingRates(recipient, lines): Promise<ShippingRate[]> {
      const res = await call<{ standard?: number; express?: number; priority?: number }>(`/shops/${shopId}/orders/shipping.json`, {
        method: 'POST',
        body: JSON.stringify({ line_items: toItems(lines), address_to: toAddress(recipient) }),
      });
      const rates: ShippingRate[] = [];
      if (res.standard != null) rates.push({ id: 'standard', method: 'standard', name: 'Standard', cost: res.standard });
      const fast = res.express ?? res.priority;
      if (fast != null) rates.push({ id: res.express != null ? 'express' : 'priority', method: 'express', name: 'Express', cost: fast });
      return rates;
    },

    async createOrder({ externalId, recipient, lines, shippingMethod }) {
      const res = await call<{ id: string }>(`/shops/${shopId}/orders.json`, {
        method: 'POST',
        body: JSON.stringify({
          external_id: externalId,
          label: externalId,
          line_items: toItems(lines),
          // 1 = standard, 2 = priority, 3 = express (Printify shipping_method codes)
          shipping_method: shippingMethod === 'express' ? 3 : 1,
          send_shipping_notification: false,
          address_to: toAddress(recipient),
        }),
      });
      return { externalId: res.id, status: 'created', shipments: [] };
    },

    async confirmOrder(printifyOrderId) {
      await call(`/shops/${shopId}/orders/${printifyOrderId}/send_to_production.json`, { method: 'POST' });
      return mapOrder(await call<PfyOrder>(`/shops/${shopId}/orders/${printifyOrderId}.json`));
    },

    async getOrder(printifyOrderId) {
      return mapOrder(await call<PfyOrder>(`/shops/${shopId}/orders/${printifyOrderId}.json`));
    },

    async cancelOrder(printifyOrderId) {
      await call(`/shops/${shopId}/orders/${printifyOrderId}/cancel.json`, { method: 'POST' });
    },
  };
}

/** Called after importing a product from the `product:publish:started` webhook. */
export async function reportPublishSucceeded(token: string, shopId: string, productId: string, handle: string) {
  await providerFetch('printify', `${BASE}/shops/${shopId}/products/${productId}/publishing_succeeded.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ external: { id: productId, handle } }),
  });
}
