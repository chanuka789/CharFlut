/**
 * Client-side state shared by all islands (cart, currency, UI panels, wishlist).
 * The cart here is for display only: the server re-prices every line at checkout.
 */
import { atom, computed } from 'nanostores';
import type { CartLine, Currency } from './types';
import { FREE_SHIPPING } from './money';

const CART_KEY = 'cf.cart.v1';
const WISH_KEY = 'cf.wish.v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or storage blocked: cart still works for this page view */
  }
}

function readCurrencyCookie(): Currency {
  if (typeof document === 'undefined') return 'USD';
  const m = document.cookie.match(/(?:^|; )cf_currency=(USD|GBP)/);
  if (m) return m[1] as Currency;
  return (document.documentElement.dataset.currency as Currency) || 'USD';
}

export const $currency = atom<Currency>(readCurrencyCookie());
export function setCurrency(c: Currency) {
  $currency.set(c);
  document.cookie = `cf_currency=${c}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.dataset.currency = c;
  document.dispatchEvent(new CustomEvent('cf:currency', { detail: c }));
}

export const $cart = atom<CartLine[]>(read<CartLine[]>(CART_KEY, []));
$cart.listen((v) => write(CART_KEY, v));

export const $cartCount = computed($cart, (lines) => lines.reduce((n, l) => n + l.quantity, 0));
export const $subtotal = computed([$cart, $currency], (lines, cur) =>
  lines.reduce((sum, l) => sum + l.unitPrice[cur] * l.quantity, 0),
);
export const $freeShippingProgress = computed([$subtotal, $currency], (sub, cur) => ({
  remaining: Math.max(0, FREE_SHIPPING[cur] - sub),
  ratio: Math.min(1, sub / FREE_SHIPPING[cur]),
}));

export function addToCart(line: Omit<CartLine, 'quantity'>, quantity = 1) {
  const lines = $cart.get();
  const i = lines.findIndex((l) => l.productId === line.productId && l.variantKey === line.variantKey);
  if (i >= 0) {
    const next = [...lines];
    next[i] = { ...next[i], quantity: Math.min(10, next[i].quantity + quantity) };
    $cart.set(next);
  } else {
    $cart.set([...lines, { ...line, quantity }]);
  }
}
export function updateQuantity(productId: string, variantKey: string, quantity: number) {
  const next = $cart
    .get()
    .map((l) => (l.productId === productId && l.variantKey === variantKey ? { ...l, quantity } : l))
    .filter((l) => l.quantity > 0);
  $cart.set(next);
}
export function removeLine(productId: string, variantKey: string) {
  updateQuantity(productId, variantKey, 0);
}
export function clearCart() {
  $cart.set([]);
}

/* ---------- UI panels ---------- */
export type Panel = 'cart' | 'search' | 'menu' | null;
export const $panel = atom<Panel>(null);
export const openPanel = (p: Panel) => $panel.set(p);
export const closePanel = () => $panel.set(null);

/* ---------- Wishlist ---------- */
export const $wishlist = atom<string[]>(read<string[]>(WISH_KEY, []));
$wishlist.listen((v) => write(WISH_KEY, v));
export function toggleWish(slug: string) {
  const w = $wishlist.get();
  $wishlist.set(w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug]);
}

/* ---------- Toasts ---------- */
export type Toast = { id: number; message: string };
export const $toasts = atom<Toast[]>([]);
export function toast(message: string) {
  const id = Date.now() + Math.random();
  $toasts.set([...$toasts.get(), { id, message }]);
  setTimeout(() => $toasts.set($toasts.get().filter((t) => t.id !== id)), 3200);
}
