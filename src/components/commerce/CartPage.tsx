import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import Garment from '@/components/product/Garment';
import IconR from '@/components/ui/IconR';
import { formatMoney, FREE_SHIPPING } from '@/lib/money';
import { $cart, $currency, $freeShippingProgress, $subtotal, removeLine, updateQuantity } from '@/lib/stores';

/** Full cart page. Totals here are estimates; the server re-prices everything at checkout. */
export default function CartPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const lines = useStore($cart);
  const cur = useStore($currency);
  const subtotal = useStore($subtotal);
  const progress = useStore($freeShippingProgress);

  if (!ready) return <div className="skeleton h-80" aria-busy="true" />;

  if (!lines.length)
    return (
      <div className="panel flex flex-col items-center gap-4 py-20 text-center">
        <IconR name="bag" size={32} />
        <h2 className="t-h2">Your cart is empty</h2>
        <p className="text-muted">Tees from {formatMoney(cur === 'USD' ? 2999 : 2499, cur)}. Hoodies from {formatMoney(cur === 'USD' ? 5999 : 4999, cur)}.</p>
        <a href="/shop" className="btn btn-primary mt-2">
          <span>Start shopping</span>
        </a>
      </div>
    );

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <ul className="divide-y divide-line border-y border-line lg:col-span-8">
        {lines.map((l) => (
          <li key={l.productId + l.variantKey} className="grid grid-cols-[96px_1fr] gap-4 py-6 sm:grid-cols-[140px_1fr] sm:gap-6">
            <a href={`/shop/${l.category}/${l.slug}`} className="aspect-[4/5] rounded-[var(--radius-md)] bg-surface p-3">
              <Garment category={l.category} color={l.colorHex} ink={l.inkHex} design={l.design} className="h-full w-full" />
            </a>
            <div className="flex flex-col">
              <div className="flex flex-wrap justify-between gap-2">
                <a href={`/shop/${l.category}/${l.slug}`} className="font-display text-lg font-extrabold uppercase leading-tight">
                  {l.title}
                </a>
                <span className="t-price">{formatMoney(l.unitPrice[cur] * l.quantity, cur)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {l.colorName} · Size {l.size} · {formatMoney(l.unitPrice[cur], cur)} each
              </p>
              <div className="mt-auto flex items-center gap-4 pt-4">
                <label className="sr-only" htmlFor={`q-${l.variantKey}`}>
                  Quantity
                </label>
                <select id={`q-${l.variantKey}`} className="input !min-h-11 !w-24 !py-2" value={l.quantity} onChange={(e) => updateQuantity(l.productId, l.variantKey, Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button type="button" className="text-sm font-semibold underline underline-offset-4" onClick={() => removeLine(l.productId, l.variantKey)}>
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="lg:col-span-4">
        <div className="panel lg:sticky lg:top-[calc(var(--header-h)+var(--bar-h)+24px)]">
          <h2 className="t-h3 mb-5 uppercase">Summary</h2>
          <dl className="space-y-3 text-[0.9375rem]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="t-price">{formatMoney(subtotal, cur)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd className="text-muted">{progress.remaining === 0 ? 'Free' : 'At checkout'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{cur === 'GBP' ? 'VAT' : 'Tax'}</dt>
              <dd className="text-muted">{cur === 'GBP' ? 'Included' : 'At checkout'}</dd>
            </div>
          </dl>
          <div className="my-5 h-px bg-line" />
          <div className="flex justify-between text-lg font-semibold">
            <span>Estimated total</span>
            <span className="t-price">{formatMoney(subtotal, cur)}</span>
          </div>
          {progress.remaining > 0 && (
            <p className="mt-4 text-sm text-muted">
              Add {formatMoney(progress.remaining, cur)} more for free shipping (orders over {formatMoney(FREE_SHIPPING[cur], cur)}).
            </p>
          )}
          <a href="/checkout" className="btn btn-primary btn-block btn-lg mt-6">
            <IconR name="lock" size={18} />
            <span>Checkout</span>
          </a>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <IconR name="lock" size={14} /> Secure card payment · Visa · Mastercard
          </p>
        </div>
      </aside>
    </div>
  );
}
