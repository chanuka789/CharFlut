/**
 * Printful API. Sync products use v1 (`/store/products`, not in v2 yet); orders, shipping rates and
 * mockups use v2 (open beta: https://developers.printful.com/docs/v2-beta/). Keep v2 changes inside this file.
 * Token: private token for a "Manual order platform / API" store. ~120 req/min.
 */
import {
  providerFetch,
  type PrintProvider,
  type ProviderOrder,
  type ProviderOrderStatus,
  type Recipient,
  type ShippingRate,
  type SyncedProduct,
} from './types';

const V1 = 'https://api.printful.com';
const V2 = 'https://api.printful.com/v2';

type PflSyncVariant = {
  id: number;
  external_id: string;
  sku: string;
  retail_price: string;
  size: string;
  color: string;
  availability_status: string;
  product: { variant_id: number };
  files: { type: string; preview_url: string }[];
};
type PflOrderV2 = {
  id: number;
  external_id: string;
  status: string;
  costs?: { subtotal?: string; shipping?: string };
};
type PflShipmentV2 = { carrier: string; tracking_number: string; tracking_url: string };

const cents = (s?: string) => (s ? Math.round(parseFloat(s) * 100) : undefined);

export function createPrintful(token: string, storeId?: string): PrintProvider {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (storeId) headers['X-PF-Store-Id'] = storeId;
  const v1 = <T>(path: string, init: RequestInit = {}) => providerFetch<{ result: T; paging?: { total: number; offset: number; limit: number } }>('printful', `${V1}${path}`, { ...init, headers });
  const v2 = <T>(path: string, init: RequestInit = {}) => providerFetch<{ data: T }>('printful', `${V2}${path}`, { ...init, headers });

  const mapStatus = (s: string): ProviderOrderStatus => {
    if (s === 'canceled' || s === 'cancelled') return 'cancelled';
    if (s === 'fulfilled' || s === 'partial') return 'shipped';
    if (s === 'inprocess' || s === 'pending') return 'in_production';
    if (s === 'failed' || s === 'onhold') return 'failed';
    return 'created';
  };

  const getSync = async (id: string): Promise<SyncedProduct> => {
    const { result } = await v1<{ sync_product: { id: number; name: string; thumbnail_url: string }; sync_variants: PflSyncVariant[] }>(`/store/products/${id}`);
    return {
      provider: 'printful',
      providerProductId: String(result.sync_product.id),
      title: result.sync_product.name,
      tags: [],
      images: [
        { src: result.sync_product.thumbnail_url },
        ...result.sync_variants.flatMap((v) => v.files.filter((f) => f.type === 'preview').map((f) => ({ src: f.preview_url, variantIds: [String(v.id)] }))),
      ],
      variants: result.sync_variants.map((v) => ({
        providerVariantId: String(v.id),
        sku: v.sku,
        size: v.size,
        colorName: v.color,
        cost: 0, // filled from catalog prices by the sync job (GET /v2/catalog-variants/{id}/prices)
        inStock: v.availability_status === 'active',
      })),
    };
  };

  const toRecipient = (r: Recipient) => ({
    name: r.name,
    email: r.email,
    phone: r.phone,
    address1: r.address1,
    address2: r.address2,
    city: r.city,
    state_code: r.country === 'US' ? r.region : undefined,
    zip: r.zip,
    country_code: r.country,
  });

  const readOrder = async (id: string): Promise<ProviderOrder> => {
    const { data: o } = await v2<PflOrderV2>(`/orders/${id}`);
    let shipments: PflShipmentV2[] = [];
    try {
      shipments = (await v2<PflShipmentV2[]>(`/orders/${id}/shipments`)).data;
    } catch {
      /* no shipments yet */
    }
    return {
      externalId: String(o.id),
      status: mapStatus(o.status),
      cost: cents(o.costs?.subtotal),
      shippingCost: cents(o.costs?.shipping),
      shipments: shipments.map((s) => ({ carrier: s.carrier, trackingNumber: s.tracking_number, trackingUrl: s.tracking_url })),
    };
  };

  return {
    id: 'printful',

    async listProducts() {
      const out: SyncedProduct[] = [];
      let offset = 0;
      for (;;) {
        const res = await v1<{ id: number }[]>(`/store/products?limit=100&offset=${offset}`);
        for (const p of res.result) out.push(await getSync(String(p.id)));
        offset += 100;
        if (!res.paging || offset >= res.paging.total) break;
      }
      return out;
    },

    getProduct: getSync,

    async getShippingRates(recipient, lines): Promise<ShippingRate[]> {
      const { data } = await v2<{ shipping: string; shipping_method_name: string; rate: string; min_delivery_days: number; max_delivery_days: number }[]>(`/shipping-rates`, {
        method: 'POST',
        body: JSON.stringify({
          recipient: { country_code: recipient.country, state_code: recipient.region, zip: recipient.zip, city: recipient.city },
          order_items: lines.map((l) => ({ source: 'sync', sync_variant_id: Number(l.providerVariantId), quantity: l.quantity })),
          currency: 'USD',
        }),
      });
      return data.map((r) => ({
        id: r.shipping,
        method: /express|priority|fast/i.test(r.shipping) ? 'express' : 'standard',
        name: r.shipping_method_name,
        cost: cents(r.rate) ?? 0,
        minDays: r.min_delivery_days,
        maxDays: r.max_delivery_days,
      }));
    },

    async createOrder({ externalId, recipient, lines, shippingMethod }) {
      const { data } = await v2<PflOrderV2>(`/orders`, {
        method: 'POST',
        body: JSON.stringify({
          external_id: externalId,
          shipping: shippingMethod === 'express' ? 'EXPRESS' : 'STANDARD',
          recipient: toRecipient(recipient),
          order_items: lines.map((l) => ({
            source: 'sync',
            sync_variant_id: Number(l.providerVariantId),
            quantity: l.quantity,
            retail_price: l.retailPrice ? (l.retailPrice / 100).toFixed(2) : undefined,
          })),
        }),
      });
      // v2 creates a draft; nothing is charged or produced until confirmOrder.
      return { externalId: String(data.id), status: 'created', shipments: [] };
    },

    async confirmOrder(id) {
      await v2(`/orders/${id}/confirm`, { method: 'POST' });
      return readOrder(id);
    },

    getOrder: readOrder,

    async cancelOrder(id) {
      await v2(`/orders/${id}`, { method: 'DELETE' });
    },
  };
}
