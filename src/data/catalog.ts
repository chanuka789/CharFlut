/**
 * Launch catalogue used until the D1 product sync is live (plan 06, "Product sync").
 * Shapes match the D1 tables so the swap is a data-source change, not a UI change.
 * Provider IDs are placeholders: the sync job fills the real ones.
 */
import type { CategorySlug, Colorway, Drop, Product, Size } from '@/lib/types';

const COLORS = {
  black: { id: 'black', name: 'Black', hex: '#141414', ink: '#FFC800' },
  white: { id: 'white', name: 'White', hex: '#F7F7F4', ink: '#111111' },
  sand: { id: 'sand', name: 'Sand', hex: '#D9CBB0', ink: '#111111' },
  stone: { id: 'stone', name: 'Stone', hex: '#8C8C8C', ink: '#111111' },
  sun: { id: 'sun', name: 'Sun', hex: '#FFC800', ink: '#111111' },
  forest: { id: 'forest', name: 'Forest', hex: '#2F3B2F', ink: '#F4F4F1' },
  navy: { id: 'navy', name: 'Navy', hex: '#1C2433', ink: '#FFC800' },
} satisfies Record<string, Colorway>;

const TEE_SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
const HOODIE_SIZES: Size[] = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

const TEE_CARE = ['Machine wash cold, inside out', 'Do not tumble dry on high', 'Do not iron on the print'];
const HOODIE_CARE = ['Machine wash cold, inside out', 'Tumble dry low', 'Do not iron on the print'];

type Seed = Omit<Product, 'sizes' | 'care' | 'status' | 'details'> & { details?: string[] };

const seeds: Seed[] = [
  {
    id: 'p_01',
    slug: 'cf-monogram-heavy-tee',
    title: 'CF Monogram Heavy Tee',
    category: 'tees',
    fit: 'oversized',
    tagline: 'The mark, small and sure.',
    description:
      'A heavyweight oversized tee with the CF monogram printed small on the chest. Dropped shoulders, a wide body and a thick ribbed collar that keeps its shape.',
    fabric: '100% combed cotton, 240 gsm',
    design: 'monogram',
    colors: [COLORS.black, COLORS.white, COLORS.sand],
    price: { USD: 3499, GBP: 2999 },
    provider: 'printful',
    dropSlug: 'drop-01-first-light',
    isNew: true,
    bestSeller: true,
    popularity: 98,
    createdAt: '2026-09-28',
  },
  {
    id: 'p_02',
    slug: 'wordmark-boxy-tee',
    title: 'Wordmark Boxy Tee',
    category: 'tees',
    fit: 'oversized',
    tagline: 'CHARFLUT across the chest.',
    description:
      'Our wordmark in heavy Archivo, printed edge to edge across a boxy cut. Built for layering or wearing loud on its own.',
    fabric: '100% combed cotton, 220 gsm',
    design: 'wordmark',
    colors: [COLORS.white, COLORS.black, COLORS.sun],
    price: { USD: 3299, GBP: 2799 },
    provider: 'printful',
    dropSlug: 'drop-01-first-light',
    isNew: true,
    popularity: 91,
    createdAt: '2026-09-27',
  },
  {
    id: 'p_03',
    slug: 'sunburst-oversized-tee',
    title: 'Sunburst Oversized Tee',
    category: 'tees',
    fit: 'oversized',
    tagline: 'A slow sunrise on your back.',
    description:
      'A large sunburst printed on the back, with a small CF on the front. Washed-soft cotton in an easy oversized fit.',
    fabric: '100% ring-spun cotton, 210 gsm',
    design: 'sunburst',
    colors: [COLORS.black, COLORS.sand, COLORS.forest],
    price: { USD: 3499, GBP: 2999 },
    provider: 'printify',
    dropSlug: 'drop-01-first-light',
    isNew: true,
    bestSeller: true,
    popularity: 95,
    createdAt: '2026-09-26',
  },
  {
    id: 'p_04',
    slug: 'grid-study-regular-tee',
    title: 'Grid Study Tee',
    category: 'tees',
    fit: 'regular',
    tagline: 'Twelve columns, one idea.',
    description:
      'A quiet grid print taken from the CharFlut layout system. Regular fit, soft hand-feel, made to be worn every day.',
    fabric: '100% combed cotton, 180 gsm',
    design: 'grid',
    colors: [COLORS.white, COLORS.stone, COLORS.navy],
    price: { USD: 2999, GBP: 2499 },
    provider: 'printify',
    popularity: 72,
    createdAt: '2026-09-10',
  },
  {
    id: 'p_05',
    slug: 'flow-lines-tee',
    title: 'Flow Lines Tee',
    category: 'tees',
    fit: 'regular',
    tagline: 'Lines that move when you do.',
    description: 'Flowing contour lines printed across the front. A regular fit with a slightly longer body.',
    fabric: '100% combed cotton, 180 gsm',
    design: 'flow',
    colors: [COLORS.black, COLORS.white],
    price: { USD: 2999, GBP: 2499 },
    provider: 'printify',
    popularity: 68,
    createdAt: '2026-09-02',
  },
  {
    id: 'p_06',
    slug: 'statement-heavy-tee',
    title: 'Statement Heavy Tee',
    category: 'tees',
    fit: 'oversized',
    tagline: 'Wear your own statement.',
    description: 'Big type, said once. A heavyweight oversized tee with a stacked statement print on the back.',
    fabric: '100% combed cotton, 240 gsm',
    design: 'statement',
    colors: [COLORS.sun, COLORS.black, COLORS.white],
    price: { USD: 3499, GBP: 2999 },
    provider: 'printful',
    bestSeller: true,
    popularity: 88,
    createdAt: '2026-08-30',
  },
  {
    id: 'p_07',
    slug: 'cf-monogram-heavy-hoodie',
    title: 'CF Monogram Heavy Hoodie',
    category: 'hoodies',
    fit: 'oversized',
    tagline: 'Weight you can feel.',
    description:
      'A 400 gsm brushed-back fleece hoodie with the CF monogram on the chest. Double-lined hood, no drawcords, dropped shoulders.',
    fabric: '80% cotton, 20% recycled polyester, 400 gsm',
    design: 'monogram',
    colors: [COLORS.black, COLORS.sand, COLORS.stone],
    price: { USD: 6999, GBP: 5999 },
    provider: 'printful',
    dropSlug: 'drop-01-first-light',
    isNew: true,
    bestSeller: true,
    popularity: 97,
    createdAt: '2026-09-28',
  },
  {
    id: 'p_08',
    slug: 'stacked-logo-hoodie',
    title: 'Stacked Logo Hoodie',
    category: 'hoodies',
    fit: 'oversized',
    tagline: 'The full mark, on your back.',
    description: 'The stacked CharFlut logo printed large on the back. Brushed fleece in a relaxed oversized cut.',
    fabric: '80% cotton, 20% recycled polyester, 350 gsm',
    design: 'stack',
    colors: [COLORS.black, COLORS.white, COLORS.forest],
    price: { USD: 6499, GBP: 5499 },
    provider: 'printful',
    dropSlug: 'drop-01-first-light',
    isNew: true,
    popularity: 90,
    createdAt: '2026-09-25',
  },
  {
    id: 'p_09',
    slug: 'orbit-regular-hoodie',
    title: 'Orbit Hoodie',
    category: 'hoodies',
    fit: 'regular',
    tagline: 'Circles in slow motion.',
    description: 'An orbit print in tone-on-tone ink. Regular fit, kangaroo pocket, ribbed cuffs and hem.',
    fabric: '80% cotton, 20% polyester, 300 gsm',
    design: 'orbit',
    colors: [COLORS.navy, COLORS.black, COLORS.stone],
    price: { USD: 5999, GBP: 4999 },
    provider: 'printify',
    popularity: 74,
    createdAt: '2026-09-05',
  },
  {
    id: 'p_10',
    slug: 'sunburst-heavy-hoodie',
    title: 'Sunburst Heavy Hoodie',
    category: 'hoodies',
    fit: 'oversized',
    tagline: 'First light, in fleece.',
    description: 'The sunburst artwork printed large on the back of our heaviest hoodie.',
    fabric: '80% cotton, 20% recycled polyester, 400 gsm',
    design: 'sunburst',
    colors: [COLORS.sand, COLORS.black],
    price: { USD: 6999, GBP: 5999 },
    provider: 'printify',
    dropSlug: 'drop-01-first-light',
    isNew: true,
    popularity: 86,
    createdAt: '2026-09-24',
  },
  {
    id: 'p_11',
    slug: 'grid-study-hoodie',
    title: 'Grid Study Hoodie',
    category: 'hoodies',
    fit: 'regular',
    tagline: 'Structure, softened.',
    description: 'The grid print on a regular-fit hoodie with a soft brushed inside.',
    fabric: '80% cotton, 20% polyester, 300 gsm',
    design: 'grid',
    colors: [COLORS.white, COLORS.stone],
    price: { USD: 5999, GBP: 4999 },
    provider: 'printify',
    popularity: 61,
    createdAt: '2026-08-20',
  },
  {
    id: 'p_12',
    slug: 'wordmark-heavy-hoodie',
    title: 'Wordmark Heavy Hoodie',
    category: 'hoodies',
    fit: 'oversized',
    tagline: 'Loud, in the calmest way.',
    description: 'The CHARFLUT wordmark across the chest of a heavyweight hoodie.',
    fabric: '80% cotton, 20% recycled polyester, 400 gsm',
    design: 'wordmark',
    colors: [COLORS.sun, COLORS.black],
    price: { USD: 6999, GBP: 5999 },
    provider: 'printful',
    bestSeller: true,
    popularity: 84,
    createdAt: '2026-08-28',
  },
];

export const products: Product[] = seeds.map((s) => ({
  ...s,
  sizes: s.category === 'tees' ? TEE_SIZES : HOODIE_SIZES,
  care: s.category === 'tees' ? TEE_CARE : HOODIE_CARE,
  details: s.details ?? [
    s.fit === 'oversized' ? 'Oversized fit. Take your usual size for a relaxed look.' : 'Regular fit. True to size.',
    'Printed just for you, ships in 2–5 working days.',
    'Direct-to-garment print, soft to the touch.',
  ],
  status: 'active',
}));

export const categories: Record<CategorySlug, { title: string; blurb: string; tone: string }> = {
  tees: {
    title: 'Tees',
    blurb: 'Heavyweight and regular tees with clean cuts and bold prints.',
    tone: '#F4F4F1',
  },
  hoodies: {
    title: 'Hoodies',
    blurb: 'Brushed fleece hoodies, built heavy and cut to last.',
    tone: '#111111',
  },
};

export const drops: Drop[] = [
  {
    slug: 'drop-01-first-light',
    number: '01',
    title: 'First Light',
    story:
      'The first CharFlut collection. Eight pieces built around one idea: a blank garment meeting light for the first time. Sun yellow, warm sand and deep black.',
    launchAt: '2026-10-20T15:00:00Z',
    lightHex: '#FFC800',
    productSlugs: [
      'cf-monogram-heavy-tee',
      'wordmark-boxy-tee',
      'sunburst-oversized-tee',
      'cf-monogram-heavy-hoodie',
      'stacked-logo-hoodie',
      'sunburst-heavy-hoodie',
    ],
  },
  {
    slug: 'drop-02-night-shift',
    number: '02',
    title: 'Night Shift',
    story: 'Navy, forest and tone-on-tone ink. A quieter drop for colder nights. Join the waitlist for first access.',
    launchAt: '2026-12-04T15:00:00Z',
    lightHex: '#7FA8FF',
    productSlugs: ['orbit-regular-hoodie', 'flow-lines-tee'],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getProductsByCategory = (c: CategorySlug) => products.filter((p) => p.category === c);
export const getDrop = (slug: string) => drops.find((d) => d.slug === slug);
export const newArrivals = () => [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
export const bestSellers = () => products.filter((p) => p.bestSeller).sort((a, b) => b.popularity - a.popularity);
export const related = (p: Product, n = 4) =>
  products
    .filter((x) => x.id !== p.id && (x.design === p.design || x.category !== p.category))
    .slice(0, n);
