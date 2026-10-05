export type Currency = 'USD' | 'GBP';
export type ProviderId = 'printify' | 'printful';
export type CategorySlug = 'tees' | 'hoodies';
export type Fit = 'oversized' | 'regular';
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

/** Money is always stored as integer minor units (cents / pence). */
export type Money = { amount: number; currency: Currency };

export type Colorway = {
  id: string;
  name: string;
  /** Garment fabric colour (used by 3D viewer and SVG mockups) */
  hex: string;
  /** Ink colour for the print on this garment */
  ink: string;
};

/** Artwork keys rendered by <PrintArt>. Real products use provider mockups from R2. */
export type PrintDesign = 'monogram' | 'wordmark' | 'stack' | 'sunburst' | 'grid' | 'flow' | 'statement' | 'orbit';

export type Variant = {
  id: string;
  sku: string;
  size: Size;
  colorId: string;
  price: Record<Currency, number>;
  /** Provider cost in USD cents (from catalog API) */
  cost: number;
  provider: ProviderId;
  providerProductId: string;
  providerVariantId: string;
  inStock: boolean;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  category: CategorySlug;
  fit: Fit;
  tagline: string;
  description: string;
  details: string[];
  fabric: string;
  care: string[];
  design: PrintDesign;
  colors: Colorway[];
  sizes: Size[];
  price: Record<Currency, number>;
  compareAt?: Record<Currency, number>;
  provider: ProviderId;
  dropSlug?: string;
  isNew?: boolean;
  bestSeller?: boolean;
  popularity: number;
  createdAt: string;
  status: 'draft' | 'active' | 'hidden';
};

export type Drop = {
  slug: string;
  title: string;
  number: string;
  story: string;
  launchAt: string;
  /** Colour of the 3D light for this drop (plan 01, signature moment 5) */
  lightHex: string;
  productSlugs: string[];
};

export type CartLine = {
  productId: string;
  slug: string;
  variantKey: string; // `${colorId}:${size}`
  title: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  inkHex: string;
  design: PrintDesign;
  category: CategorySlug;
  size: Size;
  quantity: number;
  unitPrice: Record<Currency, number>;
};

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'needs_attention';
