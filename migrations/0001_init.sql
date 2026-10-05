-- CharFlut D1 schema (plan 08, "Main database tables"). Money is integer minor units (cents / pence).
PRAGMA foreign_keys = ON;

CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('category', 'drop')),
  title TEXT NOT NULL,
  number TEXT,
  story TEXT,
  launch_at TEXT,
  light_hex TEXT,
  hero_r2_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tees', 'hoodies')),
  fit TEXT NOT NULL DEFAULT 'regular',
  tagline TEXT,
  description TEXT,
  details_json TEXT NOT NULL DEFAULT '[]',
  fabric TEXT,
  care_json TEXT NOT NULL DEFAULT '[]',
  seo_title TEXT,
  seo_description TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('printify', 'printful')),
  provider_product_id TEXT NOT NULL,
  model_r2_key TEXT,
  design_key TEXT,
  collection_id TEXT REFERENCES collections(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'hidden')),
  popularity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (provider, provider_product_id)
);
CREATE INDEX idx_products_status ON products(status, category);

CREATE TABLE variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT,
  size TEXT NOT NULL,
  color_id TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  price_usd INTEGER NOT NULL,
  price_gbp INTEGER NOT NULL,
  compare_usd INTEGER,
  compare_gbp INTEGER,
  cost_usd INTEGER NOT NULL DEFAULT 0,
  provider TEXT NOT NULL,
  provider_product_id TEXT NOT NULL,
  provider_variant_id TEXT NOT NULL,
  in_stock INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (product_id, color_id, size)
);
CREATE INDEX idx_variants_provider ON variants(provider, provider_variant_id);

CREATE TABLE images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  alt TEXT,
  color_id TEXT,
  view TEXT,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT,
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  consent_source TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE addresses (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  region TEXT,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL CHECK (country IN ('US', 'GB')),
  phone TEXT,
  is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE magic_links (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE carts (
  id TEXT PRIMARY KEY,
  email TEXT,
  lines_json TEXT NOT NULL,
  currency TEXT NOT NULL,
  reminded_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE discounts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  kind TEXT NOT NULL CHECK (kind IN ('percent', 'fixed', 'free_shipping')),
  value INTEGER NOT NULL DEFAULT 0,
  currency TEXT,
  min_subtotal INTEGER,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id),
  email TEXT NOT NULL COLLATE NOCASE,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'GBP')),
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  shipping INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  discount_code TEXT,
  shipping_method TEXT NOT NULL DEFAULT 'standard',
  shipping_address_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled', 'refunded', 'needs_attention')),
  payment_method TEXT,
  payment_ref TEXT,
  payment_fee INTEGER,
  provider_cost INTEGER,
  provider_shipping INTEGER,
  country TEXT NOT NULL,
  region TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_orders_status ON orders(status, created_at);
CREATE INDEX idx_orders_email ON orders(email);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  size TEXT NOT NULL,
  color_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL,
  unit_cost INTEGER NOT NULL DEFAULT 0,
  provider TEXT NOT NULL,
  provider_product_id TEXT NOT NULL,
  provider_variant_id TEXT NOT NULL,
  provider_order_id TEXT REFERENCES provider_orders(id)
);

CREATE TABLE provider_orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'created', 'in_production', 'shipped', 'delivered', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  cost INTEGER,
  shipping_cost INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (order_id, provider)
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  method TEXT NOT NULL CHECK (method IN ('webxpay', 'paypal')),
  reference TEXT,
  status_code TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'refunded', 'error')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  fee INTEGER,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_payments_ref ON payments(method, reference);

CREATE TABLE refunds (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  photos_json TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'refunded', 'rejected', 'reprint')),
  provider_request_id TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  author TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'hidden')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  error TEXT,
  UNIQUE (provider, event_id)
);

CREATE TABLE subscribers (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  source TEXT,
  confirmed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  topic TEXT,
  order_number TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE pricing_rules (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  target_margin REAL NOT NULL,
  shipping_share_usd INTEGER NOT NULL DEFAULT 0,
  payment_fee_rate REAL NOT NULL DEFAULT 0.0485,
  rounding TEXT NOT NULL DEFAULT '.99'
);

CREATE TABLE admin_users (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'support')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  diff_json TEXT,
  at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_at ON audit_log(at);

INSERT INTO pricing_rules (id, category, target_margin, shipping_share_usd) VALUES
  ('rule_tees', 'tees', 0.45, 0),
  ('rule_hoodies', 'hoodies', 0.40, 0);
